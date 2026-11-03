import { describe, expect, it } from "vitest";
import { rest, storage, tokenFor } from "./client";

const uuid = "11111111-1111-4111-8111-111111111111";
const post = (path: string, token: string | null, body: unknown, prefer = "return=representation") =>
  rest(path, token, { method: "POST", headers: { Prefer: prefer }, body: JSON.stringify(body) });
const validPlace = (userId: string) => ({ user_id: userId, title: "맛집", content: "열 글자 이상의 후기입니다.", address: "서울 구로구" });

describe("Day55 스키마와 RLS (실제 Postgres + PostgREST)", () => {
  it("anon은 읽기만 된다", async () => {
    const alice = await tokenFor("schema-anon@example.test");
    for (const table of ["profile", "place", "place_image"]) expect((await rest(`/${table}?select=*`, null)).status).toBe(200);
    expect((await post("/place", null, validPlace(alice.id))).status).toBe(401);
    expect((await post("/profile", null, { user_id: uuid })).status).toBe(401);
  });

  it("회원가입 트리거 profile 1:1, 닉네임과 이미지는 선택값", async () => {
    const alice = await tokenFor("schema-1to1@example.test");
    const [row] = await (await rest(`/profile?user_id=eq.${alice.id}`, null)).json();
    expect(row).toMatchObject({ user_id: alice.id, nickname: null, image_path: null });
    // 두 번째 profile은 PK로 막힌다
    expect((await post("/profile", alice.token, { user_id: alice.id })).status).toBe(409);
  });

  it.each([["구글이름", "구글이름"], ["가", null], ["가".repeat(13), null]])("구글 이름 %s의 기본 닉네임은 %s", async (fullName, nickname) => {
    const user = await tokenFor(`schema-name-${crypto.randomUUID()}@example.test`, fullName);
    const [row] = await (await rest(`/profile?user_id=eq.${user.id}`, null)).json();
    expect(row.nickname).toBe(nickname);
  });

  it("타인 profile·place 변경은 RLS로 막힌다", async () => {
    const alice = await tokenFor("schema-a@example.test");
    const bob = await tokenFor("schema-b@example.test");
    const patch = await rest(`/profile?user_id=eq.${bob.id}`, alice.token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ nickname: "해커" }) });
    expect(await patch.json()).toEqual([]);
    expect((await post("/place", alice.token, validPlace(bob.id))).status).toBe(403);

    const [place] = await (await post("/place", bob.token, validPlace(bob.id))).json();
    const change = await rest(`/place?id=eq.${place.id}`, alice.token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ title: "탈취" }) });
    expect(await change.json()).toEqual([]);
    // 21단계부터 직접 영구 삭제 권한이 없다
    expect((await rest(`/place?id=eq.${place.id}`, alice.token, { method: "DELETE" })).status).toBe(403);
    expect((await post("/place_image", alice.token, { place_id: place.id, image_path: `${alice.id}/${uuid}.jpg`, position: 0 })).status).toBe(403);
    // 소유자 변경도 막힌다
    const steal = await rest(`/place?id=eq.${place.id}`, bob.token, { method: "PATCH", body: JSON.stringify({ user_id: alice.id }) });
    expect(steal.status).toBe(403);
    // 본인은 내용 수정이 가능하다
    expect((await rest(`/place?id=eq.${place.id}`, bob.token, { method: "PATCH", body: JSON.stringify({ title: "새이름" }) })).status).toBe(204);
  });

  it("NOT NULL과 길이 제약", async () => {
    const alice = await tokenFor("schema-check@example.test");
    const base = validPlace(alice.id);
    for (const bad of [
      { ...base, title: null }, { ...base, content: null }, { ...base, address: null },
      { ...base, title: "   " }, { ...base, title: "가".repeat(41) }, { ...base, content: "짧음" }, { ...base, content: " \n".repeat(20) }, { ...base, address: "" },
    ]) expect((await post("/place", alice.token, bad)).status).toBe(400);
    expect((await rest(`/profile?user_id=eq.${alice.id}`, alice.token, { method: "PATCH", body: JSON.stringify({ nickname: "가" }) })).status).toBe(400);
    expect((await rest(`/profile?user_id=eq.${alice.id}`, alice.token, { method: "PATCH", body: JSON.stringify({ nickname: "가".repeat(13) }) })).status).toBe(400);
  });

  it("DB에는 본인 폴더의 userUUID/uuidv4.ext 경로만 저장된다", async () => {
    const alice = await tokenFor("schema-path@example.test");
    const bob = await tokenFor("schema-path2@example.test");
    const setImage = (image_path: string) => rest(`/profile?user_id=eq.${alice.id}`, alice.token, { method: "PATCH", body: JSON.stringify({ image_path }) });
    expect((await setImage(`${alice.id}/${uuid}.jpg`)).status).toBe(204);
    expect((await setImage(`${bob.id}/${uuid}.jpg`)).status).toBe(403);
    expect((await setImage(`https://evil.example/${uuid}.jpg`)).status).toBe(403);
    expect((await setImage(`${alice.id}/not-a-uuid.svg`)).status).toBe(400);

    const [place] = await (await post("/place", alice.token, validPlace(alice.id))).json();
    const image = (image_path: string, position: number) => post("/place_image", alice.token, { place_id: place.id, image_path, position });
    expect((await image(`${alice.id}/${crypto.randomUUID()}.webp`, 0)).status).toBe(201);
    expect((await image(`${alice.id}/${crypto.randomUUID()}.webp`, 0)).status).toBe(409);
    expect((await image(`${alice.id}/${crypto.randomUUID()}.webp`, 5)).status).toBe(400);
    expect((await image(`${bob.id}/${crypto.randomUUID()}.webp`, 1)).status).toBe(403);
    expect((await post("/place_image", alice.token, { place_id: place.id, position: 1 })).status).toBe(403); // RLS가 NOT NULL보다 먼저 거부
  });

  it("Storage: 버킷 크기·MIME 제한과 본인 폴더 정책", async () => {
    const alice = await tokenFor("schema-storage@example.test");
    const bob = await tokenFor("schema-storage2@example.test");
    const small = new Uint8Array(10);
    const name = () => `${crypto.randomUUID()}.jpg`;
    expect((await storage(`profile-image/${alice.id}/${name()}`, alice.token, small, "image/jpeg")).status).toBe(200);
    expect((await storage(`profile-image/${bob.id}/${name()}`, alice.token, small, "image/jpeg")).status).toBe(400);
    expect((await storage(`place-image/${alice.id}/${name()}`, alice.token, small, "image/svg+xml")).status).toBe(400);
    expect((await storage(`profile-image/${alice.id}/${name()}`, alice.token, new Uint8Array(5 * 1024 * 1024 + 1), "image/jpeg")).status).toBe(400);
    expect((await storage(`place-image/${alice.id}/${name()}`, alice.token, new Uint8Array(10 * 1024 * 1024 + 1), "image/jpeg")).status).toBe(400);
    expect((await storage(`place-image/${alice.id}/${name()}`, alice.token, new Uint8Array(10 * 1024 * 1024), "image/jpeg")).status).toBe(200);
  });

  it("트리거 함수는 Data API로 호출할 수 없다", async () => {
    const alice = await tokenFor("schema-rpc@example.test");
    expect((await post("/rpc/handle_new_user", null, {})).status).toBeGreaterThanOrEqual(400);
    expect((await post("/rpc/handle_new_user", alice.token, {})).status).toBeGreaterThanOrEqual(400);
  });
});
