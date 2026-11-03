import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadImage } from "@/lib/upload";
import { APP_URL, Browser, GATEWAY_URL, testApi } from "./client";

const MB = 1024 * 1024;
const CHUNK = 4 * MB;
const jpeg = (size: number) => { const b = new Uint8Array(size); b.set([0xff, 0xd8, 0xff]); for (let i = 3; i < size; i += 4096) b[i] = i % 251; return b; };
const png = (size: number) => { const b = new Uint8Array(size); b.set([137, 80, 78, 71, 13, 10, 26, 10]); return b; };
const webp = (size: number) => { const b = new Uint8Array(size); b.set([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]); return b; };
const uuid = () => crypto.randomUUID();
type Obj = { bucket_id: string; name: string; size: number };
const objects = async (userId: string): Promise<Obj[]> => (await testApi("objects") as Obj[]).filter((o) => o.name.startsWith(userId));
const chunksOf = async (userId: string) => (await objects(userId)).filter((o) => o.bucket_id === "upload-chunk");
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function signedIn(email: string) {
  const browser = new Browser();
  await browser.login(email);
  const { body } = await browser.bootstrap();
  return { browser, id: body.me.id as string };
}
const put = (b: Browser, id: string, index: number | string, bytes: Uint8Array, origin?: string | null) =>
  b.fetch(`/api/uploads/${id}/${index}`, { method: "PUT", headers: { "content-type": "application/octet-stream" }, body: bytes as BodyInit, origin });
const finish = (b: Browser, id: string, body: unknown, origin?: string | null) => b.send(`/api/uploads/${id}`, "POST", body, origin === undefined ? {} : { origin });
/** 브라우저 코드(uploadImage)가 쿠키를 가진 세션으로 호출되도록 연결 */
const useBrowser = (browser: Browser) => vi.stubGlobal("fetch", (url: string, init: RequestInit) => browser.fetch(url, init));

describe("10MB 이미지 BFF 업로드", () => {
  beforeEach(() => testApi("reset"));
  afterEach(() => vi.unstubAllGlobals());

  it("Vercel 4.5MB ingress 뒤에서 10MB 사진이 조각으로 올라가고 내용이 그대로 합쳐진다", async () => {
    const { browser, id } = await signedIn("upload-10mb@example.test");
    const bytes = jpeg(10 * MB);
    // 조각 없이 보내면 ingress에서 막히는 조건을 먼저 확인한다
    expect((await put(browser, uuid(), 0, bytes)).status).toBe(413);

    useBrowser(browser);
    const result = await uploadImage(new File([bytes as BlobPart], "a.jpg", { type: "image/jpeg" }), "place-image");
    vi.unstubAllGlobals();

    expect(result.path).toMatch(new RegExp(`^${id}/[0-9a-f-]{36}\\.jpg$`));
    const puts = (await testApi("log") as { method: string; path: string; size: number }[]).filter((e) => e.path.includes("/upload-chunk/") && e.method === "POST");
    expect(puts.map((e) => e.size)).toEqual([CHUNK, CHUNK, 2 * MB]);
    expect(await chunksOf(id)).toEqual([]);
    const served = new Uint8Array(await (await fetch(result.url)).arrayBuffer());
    expect(served.length).toBe(10 * MB);
    expect(hash(served)).toBe(hash(bytes));
  });

  it("경계값: 10MB+1, 5MB+1은 거부하고 5MB 프로필은 허용한다", async () => {
    const { browser, id } = await signedIn("upload-limit@example.test");
    useBrowser(browser);
    await expect(uploadImage(new File([new Uint8Array(10 * MB + 1)], "a.jpg", { type: "image/jpeg" }), "place-image")).rejects.toThrow("10MB");
    await expect(uploadImage(new File([new Uint8Array(5 * MB + 1)], "a.jpg", { type: "image/jpeg" }), "profile-image")).rejects.toThrow("5MB");
    await expect(uploadImage(new File([], "a.jpg", { type: "image/jpeg" }), "place-image")).rejects.toThrow();
    await expect(uploadImage(new File([jpeg(5 * MB) as BlobPart], "a.jpg", { type: "image/jpeg" }), "profile-image")).resolves.toBeTruthy();
    vi.unstubAllGlobals();

    // 브라우저 검사를 건너뛴 직접 호출도 서버가 막는다
    const over = uuid();
    expect((await put(browser, over, 0, jpeg(CHUNK))).status).toBe(200);
    expect((await put(browser, over, 1, jpeg(MB + 1))).status).toBe(200);
    expect((await finish(browser, over, { bucket: "profile-image", type: "image/jpeg", chunks: 2 })).status).toBe(400);
    expect((await finish(browser, over, { bucket: "profile-image", type: "image/jpeg", chunks: 3 })).status).toBe(400);
    expect(await chunksOf(id)).toEqual([]);
    expect((await put(browser, uuid(), 0, new Uint8Array(CHUNK + 1))).status).toBe(413);
    expect((await put(browser, uuid(), 0, new Uint8Array(0))).status).toBe(400);
    expect((await put(browser, "not-a-uuid", 0, jpeg(10))).status).toBe(400);
    expect((await put(browser, uuid(), 3, jpeg(10))).status).toBe(400);
    expect((await put(browser, uuid(), "../x", jpeg(10))).status).not.toBe(200);
  });

  it("401과 Origin 검사", async () => {
    const anon = new Browser();
    const id = uuid();
    expect((await put(anon, id, 0, jpeg(10))).status).toBe(401);
    expect((await finish(anon, id, { bucket: "place-image", type: "image/jpeg", chunks: 1 })).status).toBe(401);
    expect((await anon.send(`/api/uploads/${id}`, "DELETE")).status).toBe(401);
    expect((await anon.send("/api/uploads", "DELETE", { bucket: "place-image", path: `${id}/${id}.jpg` })).status).toBe(401);
    const { browser } = await signedIn("upload-origin@example.test");
    expect((await put(browser, id, 0, jpeg(10), "https://evil.example")).status).toBe(403);
    expect((await finish(browser, id, { bucket: "place-image", type: "image/jpeg", chunks: 1 }, "https://evil.example")).status).toBe(403);
  });

  it.each([
    ["텍스트를 jpeg로 선언", new TextEncoder().encode("<svg onload=alert(1)>"), "image/jpeg"],
    ["png를 jpeg로 선언", png(100), "image/jpeg"],
    ["jpeg를 webp로 선언", jpeg(100), "image/webp"],
    ["svg 형식 선언", new TextEncoder().encode("<svg/>"), "image/svg+xml"],
    ["gif 형식 선언", new TextEncoder().encode("GIF89a"), "image/gif"],
  ])("위조 이미지 거부와 조각 정리: %s", async (_name, bytes, type) => {
    const { browser, id } = await signedIn(`upload-forged-${uuid()}@example.test`);
    const upload = uuid();
    expect((await put(browser, upload, 0, bytes)).status).toBe(200);
    expect((await finish(browser, upload, { bucket: "place-image", type, chunks: 1 })).status).toBe(400);
    expect(await objects(id)).toEqual([]);
  });

  it.each([["image/png", png(32), "png"], ["image/webp", webp(32), "webp"], ["image/jpeg", jpeg(32), "jpg"]])("정상 형식 허용: %s", async (type, bytes, ext) => {
    const { browser, id } = await signedIn(`upload-ok-${uuid()}@example.test`);
    const upload = uuid();
    await put(browser, upload, 0, bytes as Uint8Array);
    const response = await finish(browser, upload, { bucket: "place-image", type, chunks: 1 });
    expect(response.status).toBe(201);
    expect((await response.json()).path).toBe(`${id}/${upload}.${ext}`);
  });

  it("조각 누락과 잘못된 조각 크기를 거부한다", async () => {
    const { browser, id } = await signedIn("upload-missing@example.test");
    const missing = uuid();
    await put(browser, missing, 1, jpeg(10));
    expect((await finish(browser, missing, { bucket: "place-image", type: "image/jpeg", chunks: 2 })).status).toBe(409);
    expect((await browser.send(`/api/uploads/${missing}`, "DELETE")).status).toBe(200);

    const short = uuid();
    await put(browser, short, 0, jpeg(100));
    await put(browser, short, 1, jpeg(100));
    expect((await finish(browser, short, { bucket: "place-image", type: "image/jpeg", chunks: 2 })).status).toBe(400);
    expect(await objects(id)).toEqual([]);
  });

  it("일시적 Storage 오류는 재시도로 복구한다", async () => {
    const { browser, id } = await signedIn("upload-retry@example.test");
    await testApi("fail", { method: "POST", path: "/storage/v1/object/upload-chunk/.*/1$", status: 503, times: 1 });
    await testApi("fail", { method: "POST", path: "/storage/v1/object/place-image/", status: 503, times: 1 });
    useBrowser(browser);
    const bytes = jpeg(5 * MB);
    const result = await uploadImage(new File([bytes as BlobPart], "a.jpg", { type: "image/jpeg" }), "place-image");
    vi.unstubAllGlobals();
    expect(hash(new Uint8Array(await (await fetch(result.url)).arrayBuffer()))).toBe(hash(bytes));
    expect(await chunksOf(id)).toEqual([]);
  });

  it("계속 실패하면 오류를 전달하고 올린 조각을 지운다", async () => {
    const { browser, id } = await signedIn("upload-giveup@example.test");
    await testApi("fail", { method: "POST", path: "/storage/v1/object/upload-chunk/.*/1$", status: 503, times: 99 });
    useBrowser(browser);
    await expect(uploadImage(new File([jpeg(5 * MB) as BlobPart], "a.jpg", { type: "image/jpeg" }), "place-image")).rejects.toThrow("사진을 올리지 못했어요");
    await vi.waitFor(async () => expect(await chunksOf(id)).toEqual([]));
    vi.unstubAllGlobals();
    expect(await objects(id)).toEqual([]);
  });

  it("완료 요청 재시도와 동시 완료는 같은 결과이고 최종 파일은 하나다", async () => {
    const { browser, id } = await signedIn("upload-idempotent@example.test");
    const upload = uuid();
    await put(browser, upload, 0, jpeg(1000));
    const body = { bucket: "place-image", type: "image/jpeg", chunks: 1 };
    const [a, b] = await Promise.all([finish(browser, upload, body), finish(browser, upload, body)]);
    const statuses = [a.status, b.status].sort();
    expect(statuses[0]).toBe(201); // 늦게 온 쪽이 조각을 못 찾으면 409로 끝나도 파일은 하나다
    const retry = await finish(browser, upload, body);
    expect(retry.status).toBe(201);
    expect((await retry.json()).path).toBe(`${id}/${upload}.jpg`);
    expect((await objects(id)).filter((o) => o.bucket_id === "place-image").length).toBe(1);
    expect(await chunksOf(id)).toEqual([]);
  });

  it("타인 조각과 타인 이미지는 건드릴 수 없다", async () => {
    const alice = await signedIn("upload-alice@example.test");
    const bob = await signedIn("upload-bob@example.test");
    const upload = uuid();
    await put(alice.browser, upload, 0, jpeg(100));
    expect((await finish(bob.browser, upload, { bucket: "place-image", type: "image/jpeg", chunks: 1 })).status).toBe(409);
    await bob.browser.send(`/api/uploads/${upload}`, "DELETE");
    expect((await chunksOf(alice.id)).length).toBe(1);

    const done = await (await finish(alice.browser, upload, { bucket: "place-image", type: "image/jpeg", chunks: 1 })).json();
    expect((await bob.browser.send("/api/uploads", "DELETE", { bucket: "place-image", path: done.path })).status).toBe(400);
    expect((await bob.browser.send("/api/uploads", "DELETE", { bucket: "place-image", path: `${bob.id}/../${done.path}` })).status).toBe(400);
    expect((await objects(alice.id)).length).toBe(1);

    // 비공개 조각은 URL로 읽을 수 없다
    const pending = uuid();
    await put(alice.browser, pending, 0, jpeg(10));
    expect((await fetch(`${GATEWAY_URL}/storage/v1/object/public/upload-chunk/${alice.id}/${pending}/0`)).status).toBe(400);
  });

  it("임시 이미지는 지울 수 있지만 사용 중인 프로필 이미지는 지울 수 없다", async () => {
    const { browser, id } = await signedIn("upload-draft@example.test");
    const upload = async () => {
      const uploadId = uuid();
      await put(browser, uploadId, 0, jpeg(100));
      return (await (await finish(browser, uploadId, { bucket: "profile-image", type: "image/jpeg", chunks: 1 })).json()).path as string;
    };
    const draft = await upload();
    expect((await browser.send("/api/uploads", "DELETE", { bucket: "profile-image", path: draft })).status).toBe(200);
    expect(await objects(id)).toEqual([]);

    const used = await upload();
    expect((await browser.send("/api/profile", "PATCH", { nickname: "사용중", imagePath: used })).status).toBe(200);
    expect((await browser.send("/api/uploads", "DELETE", { bucket: "profile-image", path: used })).status).toBe(409);
    expect((await objects(id)).length).toBe(1);
    expect(APP_URL).toContain("localhost");
  });
});
