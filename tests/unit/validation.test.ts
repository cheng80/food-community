import { describe, expect, it } from "vitest";
import { detectImageType, imageError, isUuid, maxChunks, MAX_BYTES, ownsImage } from "@/lib/validation";

const user = "11111111-1111-4111-8111-111111111111";
const file = "22222222-2222-4222-8222-222222222222";
const riff = (tag: string) => new Uint8Array([...Buffer.from("RIFF"), 1, 2, 3, 4, ...Buffer.from(tag)]);

describe("image validation", () => {
  it("시그니처로 형식을 판별한다", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe("image/png");
    expect(detectImageType(riff("WEBP"))).toBe("image/webp");
    expect(detectImageType(riff("WAVE"))).toBeUndefined();
    expect(detectImageType(new TextEncoder().encode("<svg>"))).toBeUndefined();
    expect(detectImageType(new Uint8Array())).toBeUndefined();
  });

  it("버킷별 크기와 형식을 검사한다", () => {
    expect(imageError("image/png", MAX_BYTES["place-image"], "place-image")).toBeUndefined();
    expect(imageError("image/png", MAX_BYTES["place-image"] + 1, "place-image")).toContain("10MB");
    expect(imageError("image/png", MAX_BYTES["profile-image"] + 1, "profile-image")).toContain("5MB");
    expect(imageError("image/gif", 1, "place-image")).toBeTruthy();
    expect(imageError("image/png", 0, "place-image")).toBeTruthy();
    expect([maxChunks("place-image"), maxChunks("profile-image")]).toEqual([3, 2]);
  });

  it("본인 폴더의 정해진 경로만 허용한다", () => {
    expect(ownsImage(`${user}/${file}.webp`, user)).toBe(true);
    for (const bad of [`${file}/${file}.webp`, `${user}/x.webp`, `${user}/${file}.gif`, `${user}/${file}.webp.exe`, `${user}/../${file}.webp`, `${user}/${file}`, 1, null]) {
      expect(ownsImage(bad, user)).toBe(false);
    }
    expect(isUuid(file)).toBe(true);
    expect(isUuid("../..")).toBe(false);
  });
});
