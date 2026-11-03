import { afterEach, describe, expect, it, vi } from "vitest";
import { request, send } from "@/lib/api";

describe("api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("JSON이 아닌 오류 응답과 네트워크 실패도 한국어 오류로 바꾼다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 404 })));
    await expect(request("/x")).rejects.toThrow("요청을 처리하지 못했어요.");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(send("/x", "POST", {})).rejects.toMatchObject({ status: 0, message: "네트워크 연결을 확인해 주세요." });
  });
});
