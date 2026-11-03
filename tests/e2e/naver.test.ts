import { beforeEach, describe, expect, it } from "vitest";
import { Browser, testApi } from "./client";

const search = (browser: Browser, query: unknown, origin?: string) => browser.send("/api/naver/search", "POST", { query }, origin ? { origin } : {});
async function signedIn(email: string) {
  const browser = new Browser();
  await browser.login(email);
  return browser;
}

describe("네이버 지역 검색 BFF (mock NCP)", () => {
  beforeEach(() => testApi("reset"));

  it("비로그인 401, 다른 출처 403, 빈 검색어 400", async () => {
    expect((await search(new Browser(), "맛집")).status).toBe(401);
    const browser = await signedIn("naver-guard@example.test");
    expect((await search(browser, "맛집", "https://evil.example")).status).toBe(403);
    for (const bad of ["", "   ", 1, null, "가".repeat(101)]) expect((await search(browser, bad)).status).toBe(400);
  });

  it("제목 HTML 제거, 지번 주소, 1e7배 좌표 변환", async () => {
    const browser = await signedIn("naver-search@example.test");
    const { results } = await (await search(browser, "광명 칼국수")).json();
    expect(results).toEqual([
      { name: "광명 칼국수", address: "경기도 광명시 철산동 123-4", lat: 37.48, lng: 126.865 },
      { name: "철산 손칼국수 & 만두", address: "경기도 광명시 철산동 456", lat: 37.4756789, lng: 126.8701234 },
    ]);
  });

  it("소수 좌표를 그대로 읽고 잘못된 항목은 뺀다", async () => {
    const browser = await signedIn("naver-coord@example.test");
    expect((await (await search(browser, "시청 좌표원본")).json()).results[0]).toMatchObject({ lat: 37.5666103, lng: 126.9783882 });
    const { results } = await (await search(browser, "좌표오류")).json();
    expect(results.map((r: { name: string }) => r.name)).toEqual(["정상"]);
    expect((await (await search(browser, "결과없음")).json()).results).toEqual([]);
  });

  it.each([["오류401", 502], ["오류404", 502], ["오류429", 429], ["오류500", 502], ["오류503", 502], ["깨진응답", 502]])("%s는 %i로 변환하고 네이버 본문과 키를 노출하지 않는다", async (query, status) => {
    const browser = await signedIn(`naver-${status}@example.test`);
    const response = await search(browser, query);
    expect(response.status).toBe(status);
    const text = await response.text();
    expect(text).not.toMatch(/mock-secret|mock-id|SE\d\d|errorCode/);
    expect(JSON.parse(text).error).toBeTruthy();
  });

  it("네이버 지연은 timeout 504", async () => {
    const browser = await signedIn("naver-timeout@example.test");
    const started = Date.now();
    expect((await search(browser, "지연")).status).toBe(504);
    expect(Date.now() - started).toBeLessThan(8000);
  });
});

const reverse = (browser: Browser, body: unknown, origin?: string) => browser.send("/api/naver/reverse", "POST", body, origin ? { origin } : {});

describe("네이버 reverse BFF (mock NCP)", () => {
  beforeEach(() => testApi("reset"));

  it("비로그인 401, 다른 출처 403, 잘못된 좌표 400", async () => {
    expect((await reverse(new Browser(), { lat: 37.5, lng: 127 })).status).toBe(401);
    const browser = await signedIn("reverse-guard@example.test");
    expect((await reverse(browser, { lat: 37.5, lng: 127 }, "https://evil.example")).status).toBe(403);
    for (const bad of [{}, { lat: "37", lng: 127 }, { lat: 0, lng: 0 }, { lat: 91, lng: 127 }, { lat: 37, lng: 181 }, { lat: null, lng: 127 }]) expect((await reverse(browser, bad)).status).toBe(400);
  });

  it("좌표 순서(경도,위도)와 지번 조합이 맞다", async () => {
    const browser = await signedIn("reverse-ok@example.test");
    const address = async (lat: number, lng: number) => (await (await reverse(browser, { lat, lng })).json()).address;
    expect(await address(37.5666103, 126.9783882)).toBe("서울특별시 중구 태평로1가 31");
    expect(await address(34.9751, 127.5863)).toBe("전라남도 광양시 광양읍 읍내리 123-4");
    expect(await address(35.9, 128.6)).toBe("대구광역시 동구 도학동 산 45-6");
    expect(await address(36.5008113, 127.2654387)).toBe("세종특별자치시 어진동 573");
  });

  it("바다와 불완전한 주소는 address null", async () => {
    const browser = await signedIn("reverse-sea@example.test");
    expect(await (await reverse(browser, { lat: 37.5666936, lng: 125.9913201 })).json()).toEqual({ address: null });
    expect(await (await reverse(browser, { lat: 37.3, lng: 127.3 })).json()).toEqual({ address: null });
  });

  it("429, 500, 503, timeout을 오류로 돌려준다", async () => {
    const browser = await signedIn("reverse-error@example.test");
    expect((await reverse(browser, { lat: 37.5, lng: 127.0000429 })).status).toBe(429);
    expect((await reverse(browser, { lat: 37.5, lng: 127.00005 })).status).toBe(502);
    expect((await reverse(browser, { lat: 37.5, lng: 127.0000503 })).status).toBe(502);
    expect((await reverse(browser, { lat: 37.5, lng: 127.0000999 })).status).toBe(504);
  });
});
