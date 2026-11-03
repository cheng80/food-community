import { beforeEach, describe, expect, it } from "vitest";
import { Browser, GATEWAY_URL, rest, testApi } from "./client";

const jpeg = () => { const b = new Uint8Array(200); b.set([0xff, 0xd8, 0xff]); return b; };
type Obj = { bucket_id: string; name: string };
const placeFiles = async (userId: string) => (await testApi("objects") as Obj[]).filter((o) => o.bucket_id === "place-image" && o.name.startsWith(userId)).map((o) => o.name).sort();
const valid = (imagePaths: string[]) => ({ title: "광명 손칼국수", content: "면이 쫄깃하고 국물이 진해요.", placeName: "광명 할매 손칼국수", address: "경기도 광명시 철산동 123-4", lat: 37.48, lng: 126.865, imagePaths });

async function signedIn(email: string) {
  const browser = new Browser();
  await browser.login(email);
  const { body } = await browser.bootstrap();
  return { browser, id: body.me.id as string };
}
async function image(browser: Browser) {
  const id = crypto.randomUUID();
  await browser.fetch(`/api/uploads/${id}/0`, { method: "PUT", headers: { "content-type": "application/octet-stream" }, body: jpeg() as BodyInit });
  return (await (await browser.send(`/api/uploads/${id}`, "POST", { bucket: "place-image", type: "image/jpeg", chunks: 1 })).json()).path as string;
}
const images = (browser: Browser, n: number) => Promise.all(Array.from({ length: n }, () => image(browser)));
async function create(browser: Browser, n = 1) {
  const paths = await images(browser, n);
  const response = await browser.send("/api/restaurants", "POST", valid(paths));
  expect(response.status).toBe(201);
  return { id: (await response.json()).id as string, paths };
}
const detail = async (id: string) => {
  const response = await new Browser().fetch(`/api/restaurants/${id}`);
  return { status: response.status, body: await response.json() };
};
/** 서비스 토큰 없이 사용자 토큰으로 직접 RPC 호출 */
const directRpc = async (email: string, args: Record<string, unknown>) => {
  const { id, token } = await testApi("token", { email });
  const response = await rest("/rpc/save_place", token, { method: "POST", body: JSON.stringify({ p_id: null, p_title: "직접", p_content: "직접 호출한 후기입니다.", p_name: "직접 장소", p_address: "서울", p_lat: 37.5, p_lng: 127, p_image_paths: [], ...args }) });
  return { id, status: response.status, body: await response.json() };
};

describe("맛집 BFF", () => {
  beforeEach(() => testApi("reset"));

  it("등록, 목록, 상세가 실제 데이터로 이어지고 작성자는 세션의 UUID다", async () => {
    const { browser, id } = await signedIn("place-create@example.test");
    const paths = await images(browser, 3);
    const response = await browser.send("/api/restaurants", "POST", { ...valid(paths), user_id: "00000000-0000-4000-8000-000000000000", authorId: "u-weekend" });
    expect(response.status).toBe(201);
    const { id: placeId } = await response.json();

    const { status, body } = await detail(placeId);
    expect(status).toBe(200);
    expect(body).toMatchObject({ id: placeId, title: "광명 손칼국수", authorId: id, photoPaths: paths });
    expect(body.photos[0]).toBe(`${GATEWAY_URL}/storage/v1/object/public/place-image/${paths[0]}`);
    expect((await fetch(body.photos[0])).status).toBe(200);

    const list = (await new Browser().bootstrap()).body.restaurants;
    expect(list.find((r: { id: string }) => r.id === placeId)?.photoPaths).toEqual(paths);
    expect(list[0].createdAt).toBeGreaterThanOrEqual(list[list.length - 1].createdAt);
  });

  it("비로그인 401, 다른 출처 403", async () => {
    const anon = new Browser();
    const id = crypto.randomUUID();
    expect((await anon.send("/api/restaurants", "POST", valid([]))).status).toBe(401);
    expect((await anon.send(`/api/restaurants/${id}`, "PATCH", valid([]))).status).toBe(401);
    expect((await anon.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(401);
    const { browser } = await signedIn("place-origin@example.test");
    expect((await browser.send("/api/restaurants", "POST", valid([]), { origin: "https://evil.example" })).status).toBe(403);
    expect((await browser.send("/api/restaurants", "POST", "[]")).status).toBe(400);
    expect((await browser.fetch("/api/restaurants", { method: "POST", body: "x" })).status).toBe(415);
  });

  it("빈값과 경계값을 서버에서 막는다", async () => {
    const { browser } = await signedIn("place-validate@example.test");
    const [path] = await images(browser, 1);
    const post = (body: unknown) => browser.send("/api/restaurants", "POST", body);
    for (const bad of [
      { ...valid([path]), title: "" }, { ...valid([path]), title: "   " }, { ...valid([path]), title: "가".repeat(41) }, { ...valid([path]), title: 1 },
      { ...valid([path]), content: "" }, { ...valid([path]), content: "가".repeat(9) }, { ...valid([path]), address: "" }, { ...valid([path]), address: "  " },
      valid([]), { ...valid([path]), imagePaths: "x" }, { ...valid([path]), imagePaths: [path, path] }, { title: "x" },
    ]) expect((await post(bad)).status).toBe(400);
    expect((await post(valid(await images(browser, 6)))).status).toBe(400);
    expect((await post({ ...valid([path]), title: "가".repeat(40), content: "가".repeat(10) })).status).toBe(201);
  });

  it("다른 사람 사진, 경로 조작, 없는 사진은 쓸 수 없다", async () => {
    const alice = await signedIn("place-img-a@example.test");
    const bob = await signedIn("place-img-b@example.test");
    const [stolen] = await images(alice.browser, 1);
    for (const path of [stolen, `${bob.id}/../${stolen}`, `${bob.id}/${crypto.randomUUID()}.jpg`, "https://evil.example/a.jpg", 1]) {
      expect((await bob.browser.send("/api/restaurants", "POST", valid([path as string]))).status).toBe(400);
    }
  });

  it("타인 글 수정과 삭제는 403이고 내용이 그대로다", async () => {
    const alice = await signedIn("place-owner@example.test");
    const bob = await signedIn("place-intruder@example.test");
    const { id, paths } = await create(alice.browser, 2);
    const [own] = await images(bob.browser, 1);
    expect((await bob.browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid([own]), title: "탈취" })).status).toBe(403);
    expect((await bob.browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(403);
    const { body } = await detail(id);
    expect(body.title).toBe("광명 손칼국수");
    expect(body.photoPaths).toEqual(paths);
    expect(await placeFiles(alice.id)).toEqual([...paths].sort());
  });

  it("없는 글과 잘못된 id는 404", async () => {
    const { browser } = await signedIn("place-404@example.test");
    for (const id of [crypto.randomUUID(), "not-a-uuid"]) {
      expect((await new Browser().fetch(`/api/restaurants/${id}`)).status).toBe(404);
      expect((await browser.send(`/api/restaurants/${id}`, "PATCH", valid([]))).status).toBe(404);
      expect((await browser.send(`/api/restaurants/${id}`, "DELETE")).status).toBe(404);
    }
  });

  it("수정하면 순서대로 저장하고 빠진 사진 파일만 지운다", async () => {
    const { browser, id: userId } = await signedIn("place-update@example.test");
    const { id, paths: [a, b, c] } = await create(browser, 3);
    const [d] = await images(browser, 1);
    const response = await browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid([d, c, a]), title: "새 이름" });
    expect(response.status).toBe(200);
    const { body } = await detail(id);
    expect(body).toMatchObject({ title: "새 이름", photoPaths: [d, c, a] });
    expect(await placeFiles(userId)).toEqual([a, c, d].sort());
    expect(await placeFiles(userId)).not.toContain(b);
  });

  it("저장 실패 시 글과 기존 파일이 그대로이고 새 사진으로 재시도할 수 있다", async () => {
    const { browser, id: userId } = await signedIn("place-rollback@example.test");
    const { id, paths } = await create(browser, 2);
    const [fresh] = await images(browser, 1);
    await testApi("fail", { method: "POST", path: "^/rest/v1/rpc/save_place$", status: 503, times: 1 });
    expect((await browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid([fresh]), title: "실패해야 함" })).status).toBe(502);
    const { body } = await detail(id);
    expect(body.title).toBe("광명 손칼국수");
    expect(body.photoPaths).toEqual(paths);
    expect(await placeFiles(userId)).toEqual([...paths, fresh].sort());
    expect((await browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid([fresh]), title: "재시도" })).status).toBe(200);
    expect(await placeFiles(userId)).toEqual([fresh]);
  });

  it("RPC는 원자적이다: 이미지 저장에서 실패하면 글 변경도 롤백된다 (실제 Postgres)", async () => {
    const { browser, id: userId } = await signedIn("place-atomic@example.test");
    const first = await create(browser, 1);
    const second = await create(browser, 1);
    // second 수정이 first의 경로를 쓰면 unique 위반으로 실패해야 한다
    const conflict = await browser.send(`/api/restaurants/${second.id}`, "PATCH", { ...valid(first.paths), title: "롤백 대상" });
    expect(conflict.status).toBe(409);
    const { body } = await detail(second.id);
    expect(body.title).toBe("광명 손칼국수");
    expect(body.photoPaths).toEqual(second.paths);
    expect(await placeFiles(userId)).toEqual([...first.paths, ...second.paths].sort());
  });

  it("RPC를 직접 호출해도 사진 수, 소유권, 롤백이 지켜진다", async () => {
    const email = "place-direct@example.test";
    const { browser, id: userId } = await signedIn(email);
    const count = async () => (await (await rest(`/place?user_id=eq.${userId}&select=id`, null)).json()).length;
    expect((await directRpc(email, { p_image_paths: [] })).status).toBe(400);
    const six = Array.from({ length: 6 }, () => `${userId}/${crypto.randomUUID()}.jpg`);
    expect((await directRpc(email, { p_image_paths: six })).status).toBe(400);
    expect((await directRpc(email, { p_image_paths: [`${crypto.randomUUID()}/${crypto.randomUUID()}.jpg`] })).status).toBe(403);
    expect(await count()).toBe(0); // 이미지 단계 실패로 place INSERT도 롤백

    const other = await signedIn("place-direct-other@example.test");
    const owned = await create(other.browser, 1);
    const intrusion = await directRpc(email, { p_id: owned.id, p_image_paths: [`${userId}/${crypto.randomUUID()}.jpg`] });
    expect(intrusion.body.code).toBe("P0002"); // RLS로 0행. BFF는 이 코드를 404로 바꾼다
    expect((await detail(owned.id)).body.photoPaths).toEqual(owned.paths);
    const anon = await rest("/rpc/save_place", null, { method: "POST", body: JSON.stringify({ p_id: null, p_title: "익명", p_content: "익명 호출 후기입니다.", p_name: "직접 장소", p_address: "서울", p_lat: 37.5, p_lng: 127, p_image_paths: [`${userId}/${crypto.randomUUID()}.jpg`] }) });
    expect(anon.status).toBe(401);
    expect(browser).toBeTruthy();
  });

  it("같은 글 동시 저장은 직렬화되어 한 요청의 사진 묶음만 남는다 (실제 Postgres 동시 연결)", async () => {
    const { browser, id: userId } = await signedIn("place-concurrent@example.test");
    const { id } = await create(browser, 1);
    const sets = await Promise.all(Array.from({ length: 6 }, () => images(browser, 3)));
    const results = await Promise.all(sets.map((paths, i) => browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid(paths), title: `동시 ${i}` })));
    expect(results.map((r) => r.status)).toEqual(Array(6).fill(200));
    const { body } = await detail(id);
    const winner = sets.find((set) => set[0] === body.photoPaths[0]);
    expect(body.photoPaths).toEqual(winner);
    expect(body.title).toBe(`동시 ${sets.indexOf(winner!)}`);
    const files = await placeFiles(userId);
    expect(winner!.every((path) => files.includes(path))).toBe(true);
    // 진 요청의 사진도 removed_paths로 돌아와 파일이 정리된다
    expect(files).toEqual([...winner!].sort());
  });

  it("같은 사진으로 동시 등록하면 하나만 성공하고 글이 하나만 생긴다", async () => {
    const { browser, id: userId } = await signedIn("place-dupe@example.test");
    const [path] = await images(browser, 1);
    const results = await Promise.all([browser.send("/api/restaurants", "POST", valid([path])), browser.send("/api/restaurants", "POST", valid([path]))]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await (await rest(`/place?user_id=eq.${userId}&select=id`, null)).json()).length).toBe(1);
  });

  it("사용 중인 글 사진은 임시 이미지 삭제로 지울 수 없다", async () => {
    const { browser, id: userId } = await signedIn("place-used@example.test");
    const { paths } = await create(browser, 1);
    expect((await browser.send("/api/uploads", "DELETE", { bucket: "place-image", path: paths[0] })).status).toBe(409);
    expect(await placeFiles(userId)).toEqual(paths);
  });
});

describe("장소명과 좌표", () => {
  beforeEach(() => testApi("reset"));

  it("글 제목과 장소명을 따로 저장하고 좌표를 돌려준다", async () => {
    const { browser } = await signedIn("loc-save@example.test");
    const paths = await images(browser, 1);
    const { id } = await (await browser.send("/api/restaurants", "POST", { ...valid(paths), title: "아이와 가기 좋은 집", placeName: "광명 할매 손칼국수" })).json();
    expect((await detail(id)).body).toMatchObject({ title: "아이와 가기 좋은 집", placeName: "광명 할매 손칼국수", lat: 37.48, lng: 126.865 });
    const [row] = await testApi("query", { sql: "select title, name, address, lat, lng from public.place where id = $1", params: [id] });
    expect(row).toEqual({ title: "아이와 가기 좋은 집", name: "광명 할매 손칼국수", address: "경기도 광명시 철산동 123-4", lat: 37.48, lng: 126.865 });
    const listed = (await new Browser().bootstrap()).body.restaurants.find((r: { id: string }) => r.id === id);
    expect(listed).toMatchObject({ placeName: "광명 할매 손칼국수", lat: 37.48 });
  });

  it("장소명, 주소, 좌표가 잘못되면 서버가 막는다", async () => {
    const { browser } = await signedIn("loc-validate@example.test");
    const [path] = await images(browser, 1);
    for (const bad of [{ placeName: "" }, { placeName: "  " }, { placeName: "가".repeat(61) }, { placeName: 1 }, { address: "" }, { lat: 0 }, { lng: 0 }, { lat: 91 }, { lng: 181 }, { lat: "37.5" }, { lat: null }, { lng: undefined }]) {
      expect((await browser.send("/api/restaurants", "POST", { ...valid([path]), ...bad })).status).toBe(400);
    }
    const { id } = await (await browser.send("/api/restaurants", "POST", valid([path]))).json();
    expect((await browser.send(`/api/restaurants/${id}`, "PATCH", { ...valid([path]), lat: 0 })).status).toBe(400);
    expect((await detail(id)).body.lat).toBe(37.48);
  });

  it("RPC는 좌표 없는 저장을 거부하고 전체를 롤백한다 (실제 Postgres)", async () => {
    const email = "loc-rpc@example.test";
    const { id: userId } = await signedIn(email);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    for (const bad of [{ p_lat: null }, { p_lng: null }, { p_name: null }, { p_lat: 0 }]) expect((await directRpc(email, { p_name: "장소", p_lat: 37.5, p_lng: 127, p_image_paths: [path], ...bad })).status).toBe(400);
    const [{ count }] = await testApi("query", { sql: "select count(*)::int as count from public.place where user_id = $1", params: [userId] });
    expect(count).toBe(0);
  });

  it("기존 행은 좌표를 추정하지 않고 NULL로 유지하며, 수정은 장소를 골라야 한다", async () => {
    const legacy = "22222222-2222-4222-8222-222222222222";
    expect((await detail(legacy)).body).toMatchObject({ title: "좌표 없는 옛 글", placeName: null, lat: null, lng: null, address: "서울 구로구" });
    const { token } = await testApi("token", { email: "legacy@example.test" });
    // 장소 없이 내용만 바꾸는 직접 수정은 막힌다
    expect((await rest(`/place?id=eq.${legacy}`, token, { method: "PATCH", body: JSON.stringify({ title: "새 제목" }) })).status).toBe(400);
    const update = await rest("/rpc/save_place", token, { method: "POST", body: JSON.stringify({ p_id: legacy, p_title: "새 제목", p_content: "좌표를 새로 고른 후기입니다.", p_name: null, p_address: "서울", p_lat: null, p_lng: null, p_image_paths: ["11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333.jpg"] }) });
    expect(update.status).toBe(400);
    expect((await detail(legacy)).body.title).toBe("좌표 없는 옛 글");
    // 삭제는 좌표 없이도 된다
    expect(await (await rest("/rpc/soft_delete_place", token, { method: "POST", body: JSON.stringify({ p_id: legacy }) })).json()).toBe(true);
    expect((await detail(legacy)).status).toBe(404);
  });
});
