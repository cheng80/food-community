import { describe, expect, it } from "vitest";
import { nicknameError, safeNext } from "@/lib/format";

describe("safeNext", () => {
  it.each(["/", "/me", "/restaurants/1?x=1", "/a//b"])("내부 경로 허용: %s", (next) => expect(safeNext(next)).toBe(next));
  it.each(["//evil.example", "/\\evil.example", "\\\\evil.example", "https://evil.example", "javascript:alert(1)", "/\t/evil.example", "/\n/evil.example", "", null])("외부 경로 차단: %j", (next) => expect(safeNext(next)).toBe("/"));
  it("상대 URL로 해석해도 같은 출처에 머문다", () => {
    for (const next of ["/%2F%2Fevil.example", "/.//evil.example", "/..//evil.example"]) {
      expect(new URL(safeNext(next), "https://app.example").origin).toBe("https://app.example");
    }
  });
});

describe("nicknameError", () => {
  it.each(["맛집", "가".repeat(12), "  맛집  ", "😀😀"])("허용: %s", (v) => expect(nicknameError(v)).toBeUndefined());
  it.each(["", "   ", "가", "😀", "가".repeat(13)])("거부: %j", (v) => expect(nicknameError(v)).toBeTruthy());
});
