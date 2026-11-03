import { beforeEach, describe, expect, it } from "vitest";
import { Browser, rest, testApi } from "./client";

const jpeg = () => { const b = new Uint8Array(200); b.set([0xff, 0xd8, 0xff]); return b; };
type Obj = { bucket_id: string; name: string };
const placeFiles = async (userId: string) => (await testApi("objects") as Obj[]).filter((o) => o.bucket_id === "place-image" && o.name.startsWith(userId)).map((o) => o.name).sort();
const valid = (imagePaths: string[]) => ({ title: "삭제될 맛집", content: "소프트 삭제 확인용 후기입니다.", placeName: "구로 맛집", address: "서울특별시 구로구 구로동 1124", lat: 37.485, lng: 126.89, imagePaths });

async function signedIn(email: string) {
  const browser = new Browser();
  await browser.login(email);
  const { body } = await browser.bootstrap();
  const { token } = await testApi("token", { email });
  return { browser, id: body.me.id as string, token: token as string };
}
async function image(browser: Browser) {
  const id = crypto.randomUUID();
  await browser.fetch(`/api/uploads/${id}/0`, { method: "PUT", headers: { "content-type": "application/octet-stream" }, body: jpeg() as BodyInit });
  return (await (await browser.send(`/api/uploads/${id}`, "POST", { bucket: "place-image", type: "image/jpeg", chunks: 1 })).json()).path as string;
}
async function create(browser: Browser) {
  const paths = [await image(browser), await image(browser)];
  const { id } = await (await browser.send("/api/restaurants", "POST", valid(paths))).json();
  return { id: id as string, paths };
}
const raw = async (id: string) => (await testApi("query", { sql: "select deleted_at, (select count(*)::int from public.place_image i where i.place_id = p.id) as images from public.place p where id = $1", params: [id] }))[0];
const json = (body: unknown) => ({ method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) });

describe("소프트 삭제", () => {
  beforeEach(() => testApi("reset"));

  it("삭제 후 행과 파일은 남고 BFF의 목록·상세·수정·재삭제에서 사라진다", async () => {
    const { browser, id: userId } = await signedIn("soft-flow@example.test");
    const { id, paths } = await create(browser);
    const keep = await create(browser);
    expect((await browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(200);

    const row = await raw(id);
    expect(row.deleted_at).not.toBeNull();
    expect(row.images).toBe(2);
    expect((await placeFiles(userId))).toEqual([...paths, ...keep.paths].sort());

    expect((await new Browser().fetch(`/api/restaurants/${id}`)).status).toBe(404);
    expect((await browser.fetch(`/api/restaurants/${id}`)).status).toBe(404);
    const { body } = await browser.bootstrap();
    const mine = body.restaurants.filter((r: { authorId: string }) => r.authorId === userId).map((r: { id: string }) => r.id);
    expect(mine).toEqual([keep.id]); // 마이 페이지도 같은 store 목록을 쓴다
    expect((await browser.send(`/api/restaurants/${id}`, "PATCH", valid([await image(browser)]))).status).toBe(404);
    expect((await browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(404);
  });

  it("타인 삭제는 403이고 비로그인은 401이다", async () => {
    const alice = await signedIn("soft-owner@example.test");
    const bob = await signedIn("soft-intruder@example.test");
    const { id } = await create(alice.browser);
    expect((await bob.browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(403);
    expect((await new Browser().send(`/api/restaurants/${id}`, "DELETE")).status).toBe(401);
    expect((await alice.browser.send(`/api/restaurants/${id}`, "DELETE", undefined, { origin: "https://evil.example" })).status).toBe(403);
    expect((await raw(id)).deleted_at).toBeNull();
  });

  it("DB 오류면 삭제되지 않고 502다", async () => {
    const { browser } = await signedIn("soft-fail@example.test");
    const { id } = await create(browser);
    await testApi("fail", { method: "POST", path: "^/rest/v1/rpc/soft_delete_place$", status: 503, times: 1 });
    expect((await browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(502);
    expect((await raw(id)).deleted_at).toBeNull();
    expect((await new Browser().fetch(`/api/restaurants/${id}`)).status).toBe(200);
  });

  it("Data API 직접 읽기도 RLS로 막힌다 (실제 Postgres + PostgREST)", async () => {
    const { browser, token } = await signedIn("soft-direct-read@example.test");
    const { id } = await create(browser);
    await browser.send(`/api/restaurants/${id}`, "DELETE");
    for (const who of [null, token]) {
      expect(await (await rest(`/place?id=eq.${id}`, who)).json()).toEqual([]);
      expect(await (await rest(`/place_image?place_id=eq.${id}`, who)).json()).toEqual([]);
      expect(await (await rest(`/place?select=id,deleted_at&deleted_at=not.is.null`, who)).json()).toEqual([]);
    }
  });

  it("직접 쓰기로 복구, 숨기기, 영구 삭제, 수정을 할 수 없다", async () => {
    const { browser, id: userId, token } = await signedIn("soft-direct-write@example.test");
    const live = await create(browser);
    const dead = await create(browser);
    await browser.send(`/api/restaurants/${dead.id}`, "DELETE");

    expect((await rest(`/place?id=eq.${dead.id}`, token, json({ deleted_at: null }))).status).toBe(403);
    expect(await (await rest(`/place?id=eq.${dead.id}`, token, json({ title: "되살리기" }))).json()).toEqual([]);
    expect((await rest(`/place?id=eq.${live.id}`, token, json({ deleted_at: "2020-01-01T00:00:00Z" }))).status).toBe(403);
    expect((await rest(`/place?id=eq.${live.id}`, token, { method: "DELETE" })).status).toBe(403);
    expect((await rest("/place", token, { method: "POST", body: JSON.stringify({ user_id: userId, title: "숨긴글", content: "숨긴 상태로 넣는 후기입니다.", address: "서울", deleted_at: "2020-01-01T00:00:00Z" }) })).status).toBe(403);
    expect((await rest("/place_image", token, { method: "POST", body: JSON.stringify({ place_id: dead.id, image_path: `${userId}/${crypto.randomUUID()}.jpg`, position: 3 }) })).status).toBe(403);
    expect(await (await rest(`/place_image?place_id=eq.${dead.id}`, token, { method: "DELETE", headers: { Prefer: "return=representation" } })).json()).toEqual([]);
    expect((await raw(dead.id)).images).toBe(2);
    expect((await raw(live.id)).deleted_at).toBeNull();
  });

  it("soft_delete_place RPC는 소유자만 쓸 수 있다", async () => {
    const alice = await signedIn("soft-rpc-a@example.test");
    const bob = await signedIn("soft-rpc-b@example.test");
    const { id } = await create(alice.browser);
    const call = (token: string | null) => rest("/rpc/soft_delete_place", token, { method: "POST", body: JSON.stringify({ p_id: id }) });
    expect((await call(null)).status).toBe(401);
    expect(await (await call(bob.token)).json()).toBe(false);
    expect((await raw(id)).deleted_at).toBeNull();
    expect(await (await call(alice.token)).json()).toBe(true);
    expect(await (await call(alice.token)).json()).toBe(false);
    // save_place로 삭제된 글을 되살릴 수 없다
    const revive = await rest("/rpc/save_place", alice.token, { method: "POST", body: JSON.stringify({ p_id: id, p_title: "부활", p_content: "되살리기 시도 후기입니다.", p_name: "직접 장소", p_address: "서울", p_lat: 37.5, p_lng: 127, p_image_paths: [`${alice.id}/${crypto.randomUUID()}.jpg`] }) });
    expect((await revive.json()).code).toBe("P0002");
    expect((await raw(id)).images).toBe(2);
  });

  it("수정과 삭제가 겹쳐도 깨지지 않고 삭제 상태로 끝난다", async () => {
    const { browser } = await signedIn("soft-race@example.test");
    const { id } = await create(browser);
    const fresh = await image(browser);
    const [patch, remove] = await Promise.all([browser.send(`/api/restaurants/${id}`, "PATCH", valid([fresh])), browser.send(`/api/restaurants/${id}`, "DELETE")]);
    expect([200, 404]).toContain(patch.status);
    expect(remove.status).toBe(200);
    expect((await raw(id)).deleted_at).not.toBeNull();
    expect((await new Browser().fetch(`/api/restaurants/${id}`)).status).toBe(404);
  });
});
