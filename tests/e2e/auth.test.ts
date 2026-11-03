import { beforeEach, describe, expect, it } from "vitest";
import { APP_URL, Browser, testApi } from "./client";

const httpOnlyAll = (lines: string[], name: RegExp) => lines.filter((l) => name.test(l) && !/max-age=0/i.test(l)).every((l) => /httponly/i.test(l) && /samesite=lax/i.test(l));

describe("OAuth BFF", () => {
  beforeEach(() => testApi("reset"));

  it("비로그인 bootstrap은 공개 응답이고 세션을 만들지 않는다", async () => {
    const browser = new Browser();
    const { status, body } = await browser.bootstrap();
    expect(status).toBe(200);
    expect(body.loggedIn).toBe(false);
    expect(body.me.id).toBe("");
    expect(browser.sessionCookie()).toEqual([]);
  });

  it("login은 다른 출처와 Origin 없는 요청을 막는다", async () => {
    const browser = new Browser();
    expect((await browser.send("/api/auth/login", "POST", { next: "/" }, { origin: null })).status).toBe(403);
    expect((await browser.send("/api/auth/login", "POST", { next: "/" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await browser.send("/api/auth/login", "POST", "null")).status).toBe(400);
  });

  it("PKCE 로그인 후 토큰은 HttpOnly 쿠키에만 있고 응답 본문에 없다", async () => {
    const browser = new Browser();
    const start = await browser.send("/api/auth/login", "POST", { next: "/me" });
    const text = await start.text();
    expect(text).not.toContain("access_token");
    const { url } = JSON.parse(text);
    expect(url).toContain("code_challenge=");
    expect(url.toLowerCase()).toContain("code_challenge_method=s256");
    expect(url).toContain(encodeURIComponent(`${APP_URL}/auth/callback`));
    expect(browser.setCookies.some((l) => /code-verifier/.test(l))).toBe(true);
    expect(httpOnlyAll(browser.setCookies, /code-verifier|auth-next/)).toBe(true);

    const authorize = await browser.fetch(`${url}&test_user=pkce@example.test`);
    const callback = await browser.fetch(authorize.headers.get("location")!);
    expect(callback.headers.get("location")).toBe(`${APP_URL}/me`);
    expect(browser.sessionCookie().length).toBeGreaterThan(0);
    expect(httpOnlyAll(browser.setCookies, /^sb-.*-auth-token/)).toBe(true);
    expect(browser.cookies.has("auth-next")).toBe(false);

    const { body } = await browser.bootstrap();
    expect(body.loggedIn).toBe(true);
    expect(body.me.id).toMatch(/^[0-9a-f-]{36}$/);
    // auth.users 트리거가 profile 1:1 행을 만들었다
    expect(body.users.some((u: { id: string }) => u.id === body.me.id)).toBe(true);
  });

  it.each(["//evil.example", "https://evil.example", "/\\evil.example", "/\t/evil.example", "\\\\evil.example"])("외부 redirect를 막는다: %j", async (next) => {
    const location = await new Browser().login("redirect@example.test", next);
    expect(location).toBe(`${APP_URL}/`);
  });

  it("위조된 auth-next 쿠키로도 외부 redirect가 안 된다", async () => {
    const browser = new Browser();
    const { url } = await (await browser.send("/api/auth/login", "POST", { next: "/" })).json();
    const authorize = await browser.fetch(`${url}&test_user=forged-next@example.test`);
    browser.cookies.set("auth-next", encodeURIComponent("//evil.example"));
    const callback = await browser.fetch(authorize.headers.get("location")!);
    expect(callback.headers.get("location")).toBe(`${APP_URL}/`);
  });

  it("code 없음, 잘못된 code, 재사용, verifier 없는 다른 브라우저는 로그인되지 않는다", async () => {
    const empty = new Browser();
    expect((await empty.fetch("/auth/callback")).headers.get("location")).toContain("/login?error=oauth");
    expect((await empty.fetch("/auth/callback?code=wrong")).headers.get("location")).toContain("/login?error=oauth");

    const browser = new Browser();
    const { url } = await (await browser.send("/api/auth/login", "POST", { next: "/me" })).json();
    const authorize = await browser.fetch(`${url}&test_user=stolen@example.test`);
    const redirect = authorize.headers.get("location")!;

    const other = new Browser();
    const stolen = await other.fetch(redirect);
    expect(stolen.headers.get("location")).toContain("/login?error=oauth");
    expect((await other.bootstrap()).body.loggedIn).toBe(false);

    // 진짜 브라우저는 그대로 성공하고, 같은 code 재사용은 실패한다.
    expect((await browser.fetch(redirect)).headers.get("location")).toBe(`${APP_URL}/me`);
    expect((await browser.fetch(redirect)).headers.get("location")).toContain("/login?error=oauth");
  });

  it("서버는 쿠키를 믿지 않고 Auth 서버로 검증한다: 위조 세션은 비로그인으로 처리하고 쿠키를 지운다", async () => {
    const browser = new Browser();
    await browser.login("forged@example.test");
    const name = browser.sessionCookie()[0];
    const session = JSON.parse(Buffer.from(browser.cookies.get(name)!.replace(/^base64-/, ""), "base64url").toString());
    const [head, claims] = session.access_token.split(".");
    session.access_token = `${head}.${claims}.forged-signature`;
    browser.cookies.set(name, `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`);

    const { status, body } = await browser.bootstrap();
    expect(status).toBe(200);
    expect(body.loggedIn).toBe(false);
    expect(browser.sessionCookie()).toEqual([]);
  });

  it("만료된 access token은 refresh하고 새 쿠키를 내려준다", async () => {
    const browser = new Browser();
    await browser.login("refresh@example.test", "/", "&test_ttl=5");
    const before = browser.cookies.get(browser.sessionCookie()[0]);
    const { body } = await browser.bootstrap();
    expect(body.loggedIn).toBe(true);
    expect(browser.cookies.get(browser.sessionCookie()[0])).not.toBe(before);
    const log: { path: string }[] = await testApi("log");
    expect(log.some((entry) => entry.path === "/auth/v1/token")).toBe(true);
  });

  it("Auth 서버 장애를 로그아웃으로 오인하지 않는다", async () => {
    const browser = new Browser();
    await browser.login("outage@example.test");
    await testApi("fail", { path: "^/auth/v1/user$", status: 503, times: 10 });
    const { status } = await browser.bootstrap();
    expect(status).toBe(502);
    expect(browser.sessionCookie().length).toBeGreaterThan(0);
    await testApi("reset");
    expect((await browser.bootstrap()).body.loggedIn).toBe(true);
  });

  it("logout은 Origin을 검사하고 서버 세션까지 폐기한다", async () => {
    const browser = new Browser();
    await browser.login("logout@example.test");
    const stolenCookies = new Map(browser.cookies);
    expect((await browser.send("/api/auth/logout", "POST", undefined, { origin: "https://evil.example" })).status).toBe(403);
    expect((await browser.bootstrap()).body.loggedIn).toBe(true);

    expect((await browser.send("/api/auth/logout", "POST")).status).toBe(200);
    expect(browser.sessionCookie()).toEqual([]);
    expect((await browser.bootstrap()).body.loggedIn).toBe(false);

    const thief = new Browser();
    thief.cookies = stolenCookies;
    expect((await thief.bootstrap()).body.loggedIn).toBe(false);
    expect((await new Browser().send("/api/auth/logout", "POST")).status).toBe(200);
  });
});
