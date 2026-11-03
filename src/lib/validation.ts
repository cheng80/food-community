import { isLatitude, isLongitude } from "./naver-normalize";

export type ImageBucket = "profile-image" | "place-image";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_BYTES: Record<ImageBucket, number> = { "profile-image": 5 * 1024 * 1024, "place-image": 10 * 1024 * 1024 };
/** Vercel 함수 요청 본문 제한 4.5MB 아래. upload-chunk 버킷 제한과 같아야 한다. */
export const CHUNK_BYTES = 4 * 1024 * 1024;

export const maxChunks = (bucket: ImageBucket) => Math.ceil(MAX_BYTES[bucket] / CHUNK_BYTES);
export const isImageBucket = (value: unknown): value is ImageBucket => value === "profile-image" || value === "place-image";
export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

export function imageError(type: string, size: number, bucket: ImageBucket) {
  if (!IMAGE_TYPES.includes(type) || size <= 0 || size > MAX_BYTES[bucket]) return `jpg, png, webp 이미지만 ${MAX_BYTES[bucket] / 1024 / 1024}MB 이하로 올릴 수 있어요.`;
}

/** 경로 조작 방지: 본인 폴더의 `userUUID/uuid.ext` 형식만 허용 */
export function ownsImage(value: unknown, userId: string): value is string {
  if (typeof value !== "string") return false;
  const [folder, file, ...rest] = value.split("/");
  const [name, ext, ...dots] = (file ?? "").split(".");
  return folder === userId && !rest.length && !dots.length && isUuid(name) && Object.values(EXTENSIONS).includes(ext);
}

/** 파일 앞부분 시그니처로 실제 형식을 판별한다. 선언한 Content-Type은 믿지 않는다. */
export function detectImageType(bytes: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.slice(0, 8).join() === "137,80,78,71,13,10,26,10") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
}

export const MAX_PHOTOS = 5;
export const MAX_TITLE = 40;
export const MAX_PLACE_NAME = 60;
export const MIN_CONTENT = 10;
const chars = (value: string) => [...value.trim()].length; // DB char_length와 같은 코드포인트 기준

/** 맛집 입력 검증. 폼과 서버가 같은 규칙을 쓴다. */
export function restaurantErrors(input: Record<string, unknown>) {
  const title = typeof input.title === "string" ? chars(input.title) : 0;
  const content = typeof input.content === "string" ? chars(input.content) : 0;
  const placeName = typeof input.placeName === "string" ? chars(input.placeName) : 0;
  const address = typeof input.address === "string" ? chars(input.address) : 0;
  return {
    title: !title ? "글 제목을 입력해 주세요." : title > MAX_TITLE ? `글 제목은 ${MAX_TITLE}자 이하로 입력해 주세요.` : undefined,
    content: content < MIN_CONTENT ? `내용을 ${MIN_CONTENT}자 이상 적어 주세요.` : content > 10000 ? "내용은 10000자 이하로 입력해 주세요." : undefined,
    place: !placeName || placeName > MAX_PLACE_NAME || !address || address > 300 || !isLatitude(input.lat) || !isLongitude(input.lng) ? "장소 입력으로 위치를 골라 주세요." : undefined,
  };
}
