import { describe, expect, it } from "vitest";
import { APP_URL } from "./client";

const pngSize = (bytes: ArrayBuffer) => { const view = new DataView(bytes); return [view.getUint32(16), view.getUint32(20)]; };
const png = async (path: string) => {
  const response = await fetch(APP_URL + path);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/png");
  return pngSize(await response.arrayBuffer());
};

describe("PWA 메타데이터 (프로덕션 빌드)", () => {
  it("manifest가 설치 조건을 갖춘다", async () => {
    const response = await fetch(`${APP_URL}/manifest.webmanifest`);
    expect(response.status).toBe(200);
    const manifest = await response.json();
    expect(manifest).toMatchObject({ name: "숨은 맛집", short_name: "숨은맛집", start_url: "/", scope: "/", display: "standalone", theme_color: "#ff5a1f", background_color: "#ffffff" });
    for (const icon of manifest.icons) expect(await png(icon.src)).toEqual(icon.sizes.split("x").map(Number));
    expect(manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}:${i.purpose}`)).toEqual(["192x192:any", "512x512:any", "512x512:maskable"]);
  });

  it("문서에 manifest, 아이콘, theme-color, iOS 메타가 있다", async () => {
    const html = await (await fetch(`${APP_URL}/`)).text();
    expect(html).toMatch(/<link rel="manifest" href="\/manifest\.webmanifest"/);
    expect(html).toMatch(/<meta name="theme-color" content="#ff5a1f"/);
    expect(html).toMatch(/<meta name="apple-mobile-web-app-title" content="숨은맛집"/);
    expect(html).toMatch(/<meta name="mobile-web-app-capable" content="yes"/);
    const apple = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)?.[1];
    expect(apple).toBeTruthy();
    expect(await png(apple!.replace(APP_URL, ""))).toEqual([180, 180]);
    expect((await fetch(`${APP_URL}/favicon.ico`)).status).toBe(200);
  });
});
