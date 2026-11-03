import { describe, expect, it } from "vitest";
import { parseCoord, plainText, toPlaceResults } from "@/lib/naver-normalize";

describe("plainText", () => {
  it("검색 강조 태그를 지우고 엔티티를 평문으로 바꾼다", () => {
    expect(plainText("광명 <b>칼국수</b>")).toBe("광명 칼국수");
    expect(plainText("철산 &amp; 만두 &lt;본점&gt; &#39;맛&#x27;")).toBe("철산 & 만두 <본점> '맛'");
    expect(plainText("<script>alert(1)</script>")).toBe("alert(1)");
    expect(plainText("<b></b>")).toBe("");
    expect(plainText(undefined)).toBe("");
  });
});

describe("parseCoord", () => {
  it("소수와 1e7배 정수를 같은 값으로 읽는다", () => {
    expect(parseCoord("126.9783882", 180)).toBeCloseTo(126.9783882, 7);
    expect(parseCoord("1269783882", 180)).toBeCloseTo(126.9783882, 7);
    expect(parseCoord("375666103", 90)).toBeCloseTo(37.5666103, 7);
    expect(parseCoord("37.5666103", 90)).toBeCloseTo(37.5666103, 7);
  });
  it.each(["abc", "", " ", "0", "NaN", "Infinity", "9999999999", null, undefined, {}])("잘못된 값 거부: %j", (value) => {
    expect(parseCoord(value, 90)).toBeNull();
  });
});

describe("toPlaceResults", () => {
  const ok = { title: "<b>맛집</b>", address: "서울 구로구 구로동 1", mapx: "1268900000", mapy: "374850000" };
  it("이름, 지번 주소, 경도(mapx), 위도(mapy)로 정규화한다", () => {
    expect(toPlaceResults([ok])).toEqual([{ name: "맛집", address: "서울 구로구 구로동 1", lat: 37.485, lng: 126.89 }]);
  });
  it("쓸 수 없는 항목은 뺀다", () => {
    expect(toPlaceResults([{ ...ok, title: "<b></b>" }, { ...ok, address: "" }, { ...ok, mapx: "abc" }, { ...ok, mapy: "0" }, null])).toEqual([]);
    expect(toPlaceResults(undefined)).toEqual([]);
  });
});
