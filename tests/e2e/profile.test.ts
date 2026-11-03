import { beforeEach, describe, expect, it } from "vitest";
import { Browser, testApi } from "./client";

const jpeg = () => { const b = new Uint8Array(100); b.set([0xff, 0xd8, 0xff]); return b; };
type Obj = { bucket_id: string; name: string };
const images = async (userId: string) => (await testApi("objects") as Obj[]).filter((o) => o.bucket_id === "profile-image" && o.name.startsWith(userId)).map((o) => o.name);

async function signedIn(email: string) {
  const browser = new Browser();
  await browser.login(email);
  const { body } = await browser.bootstrap();
  return { browser, id: body.me.id as string };
}
async function uploadAvatar(browser: Browser) {
  const id = crypto.randomUUID();
  await browser.fetch(`/api/uploads/${id}/0`, { method: "PUT", headers: { "content-type": "application/octet-stream" }, body: jpeg() as BodyInit });
  return (await (await browser.send(`/api/uploads/${id}`, "POST", { bucket: "profile-image", type: "image/jpeg", chunks: 1 })).json()).path as string;
}
const patch = (browser: Browser, body: unknown, origin?: string) => browser.send("/api/profile", "PATCH", body, origin ? { origin } : {});

describe("프로필 BFF", () => {
  beforeEach(() => testApi("reset"));

  it("비로그인 401, 다른 출처 403", async () => {
    expect((await patch(new Browser(), { nickname: "맛집이웃" })).status).toBe(401);
    const { browser } = await signedIn("profile-401@example.test");
    expect((await patch(browser, { nickname: "맛집이웃" }, "https://evil.example")).status).toBe(403);
  });

  it.each([[""], ["   "], ["가"], ["가".repeat(13)], [null], [123], [undefined]])("잘못된 닉네임 거부: %j", async (nickname) => {
    const { browser } = await signedIn("profile-nick@example.test");
    expect((await patch(browser, { nickname })).status).toBe(400);
  });

  it("닉네임 공백을 다듬어 저장하고 본인 응답에만 반영한다", async () => {
    const { browser, id } = await signedIn("profile-trim@example.test");
    expect((await patch(browser, { nickname: "  주말드라이버  " })).status).toBe(200);
    const { body } = await browser.bootstrap();
    expect(body.me).toMatchObject({ id, nickname: "주말드라이버" });
  });

  it("다른 사람 폴더, 경로 조작, 없는 파일은 프로필 이미지로 쓸 수 없다", async () => {
    const alice = await signedIn("profile-a@example.test");
    const bob = await signedIn("profile-b@example.test");
    const stolen = await uploadAvatar(alice.browser);
    expect((await patch(bob.browser, { nickname: "도둑", imagePath: stolen })).status).toBe(400);
    expect((await patch(bob.browser, { nickname: "도둑", imagePath: `${bob.id}/../${stolen}` })).status).toBe(400);
    expect((await patch(bob.browser, { nickname: "도둑", imagePath: "https://evil.example/a.jpg" })).status).toBe(400);
    expect((await patch(bob.browser, { nickname: "도둑", imagePath: `${bob.id}/${crypto.randomUUID()}.jpg` })).status).toBe(400);
    expect((await patch(bob.browser, { nickname: "도둑", imagePath: 1 })).status).toBe(400);
  });

  it("이미지를 바꾸면 DB에는 경로만 남고 이전 파일을 지운다", async () => {
    const { browser, id } = await signedIn("profile-swap@example.test");
    const first = await uploadAvatar(browser);
    expect((await patch(browser, { nickname: "사진변경", imagePath: first })).status).toBe(200);
    let { body } = await browser.bootstrap();
    expect(body.me.avatarUrl).toMatch(new RegExp(`/storage/v1/object/public/profile-image/${first}$`));

    const second = await uploadAvatar(browser);
    expect((await patch(browser, { nickname: "사진변경", imagePath: second })).status).toBe(200);
    expect(await images(id)).toEqual([second]);
    ({ body } = await browser.bootstrap());
    expect(body.me.avatarUrl).toContain(second);

    // 이미지 없이 닉네임만 바꾸면 이미지가 유지된다
    expect((await patch(browser, { nickname: "닉네임만" })).status).toBe(200);
    expect(await images(id)).toEqual([second]);
  });

  it("DB 저장 실패 시 기존 이미지를 지우지 않고 오류를 돌려준다", async () => {
    const { browser, id } = await signedIn("profile-rollback@example.test");
    const first = await uploadAvatar(browser);
    await patch(browser, { nickname: "롤백확인", imagePath: first });
    const second = await uploadAvatar(browser);
    await testApi("fail", { method: "POST", path: "^/rest/v1/profile$", status: 503, times: 1 });
    expect((await patch(browser, { nickname: "바뀌면안됨", imagePath: second })).status).toBe(502);
    expect((await images(id)).sort()).toEqual([first, second].sort());
    const { body } = await browser.bootstrap();
    expect(body.me.nickname).toBe("롤백확인");
    expect(body.me.avatarUrl).toContain(first);

    // 사용자가 그대로 재시도하면 복구된다
    expect((await patch(browser, { nickname: "재시도성공", imagePath: second })).status).toBe(200);
    expect(await images(id)).toEqual([second]);
  });

  it("동시 저장 후에도 프로필이 가리키는 파일은 남아 있다", async () => {
    const { browser, id } = await signedIn("profile-race@example.test");
    const [a, b] = [await uploadAvatar(browser), await uploadAvatar(browser)];
    const results = await Promise.all([patch(browser, { nickname: "동시저장", imagePath: a }), patch(browser, { nickname: "동시저장", imagePath: b })]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    const { body } = await browser.bootstrap();
    const path = (body.me.avatarUrl as string).split("/profile-image/")[1];
    expect(await images(id)).toContain(path);
  });
});
