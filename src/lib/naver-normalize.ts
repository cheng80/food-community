export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** 검색 결과 제목의 강조 태그를 지우고 엔티티를 평문으로 바꾼다. 결과는 React가 텍스트로만 출력한다. */
export function plainText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:#(\d+)|#x([0-9a-f]+)|(\w+));/gi, (match, dec, hex, name) => {
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      return ENTITIES[name.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 공식 문서는 mapx, mapy를 WGS84 문자열이라고만 적는다. 소수와 1e7배 정수를 모두 받아
 * 범위를 벗어나거나 0이거나 숫자가 아니면 null로 돌려 잘못된 좌표를 저장하지 않게 한다.
 */
export function parseCoord(value: unknown, max: number) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (String(value).trim() === "") return null;
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw === 0) return null;
  const degrees = Math.abs(raw) <= max ? raw : raw / 1e7;
  return Math.abs(degrees) <= max ? degrees : null;
}

export const isLatitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value !== 0 && Math.abs(value) <= 90;
export const isLongitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value !== 0 && Math.abs(value) <= 180;

/** 이름, 지번 주소, 좌표 중 하나라도 쓸 수 없는 항목은 결과에서 뺀다. */
export function toPlaceResults(items: unknown): PlaceResult[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const name = plainText(item?.title);
    const address = plainText(item?.address);
    const lng = parseCoord(item?.mapx, 180);
    const lat = parseCoord(item?.mapy, 90);
    return name && address && lat !== null && lng !== null ? [{ name, address, lat, lng }] : [];
  });
}
