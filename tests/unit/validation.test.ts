import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHUNK_BYTES, detectImageType, imageError, isUuid, maxChunks, MAX_BYTES, ownsImage, restaurantErrors } from "@/lib/validation";

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

describe("restaurantErrors", () => {
  const valid = { title: "맛집", content: "가".repeat(10), placeName: "장소", address: "서울 구로구 구로동 1", lat: 37.5, lng: 127 };
  const count = (input: Record<string, unknown>) => Object.values(restaurantErrors(input)).filter(Boolean).length;
  it("제목과 장소명은 각자 검사한다", () => {
    expect(count(valid)).toBe(0);
    expect(count({ ...valid, title: "가".repeat(40) })).toBe(0);
    expect(count({ ...valid, title: "가".repeat(41) })).toBe(1);
    expect(count({ ...valid, placeName: "가".repeat(41) })).toBe(0);
    expect(count({ ...valid, placeName: "가".repeat(61) })).toBe(1);
    expect(count({ ...valid, placeName: " " })).toBe(1);
    expect(count({ ...valid, content: `  ${"가".repeat(9)}  ` })).toBe(1);
    expect(count({ title: " ", content: "", placeName: "", address: "" })).toBe(3);
  });
  it.each([[0, 127], [37.5, 0], [91, 127], [37.5, 181], ["37.5", 127], [null, 127], [undefined, undefined], [NaN, 127], [Infinity, 127]])("잘못된 좌표 거부: %j, %j", (lat, lng) => {
    expect(restaurantErrors({ ...valid, lat, lng }).place).toBeTruthy();
  });
});

describe("업로드 조각 정책", () => {
  it("조각은 Vercel 4.5MB 요청 제한 아래이고 upload-chunk 버킷 제한과 같다", () => {
    expect(CHUNK_BYTES).toBeLessThan(4.5 * 1000 * 1000);
    const file = readdirSync("supabase/migrations").find((name) => name.endsWith("_upload_chunk_bucket.sql"))!;
    expect(readFileSync(`supabase/migrations/${file}`, "utf8")).toContain(`'upload-chunk', 'upload-chunk', false, ${CHUNK_BYTES},`);
  });
  it("10MB와 5MB 파일을 조각 수 제한 안에서 나눈다", () => {
    expect(maxChunks("place-image")).toBe(3);
    expect(maxChunks("profile-image")).toBe(2);
    expect(Math.ceil((10 * 1024 * 1024) / CHUNK_BYTES)).toBeLessThanOrEqual(maxChunks("place-image"));
  });
});
