import "server-only";
import { toPlaceResults } from "@/lib/naver-normalize";
import { ApiError } from "./http";

const TIMEOUT_MS = 5000;
const SEARCH_URL = process.env.NAVER_SEARCH_URL || "https://naverapihub.apigw.ntruss.com/search/v1/local";

const KEY_MISSING = () => new ApiError(503, "네이버 API 키 설정을 준비 중이에요.");

/** 비밀 헤더는 서버에서만 붙인다. 상태 코드를 앱의 오류로 바꾸고 네이버 응답 본문은 그대로 내보내지 않는다. */
async function getJson(url: string, headers: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new ApiError(504, "네이버 응답이 늦어요. 다시 시도해 주세요.");
    throw new ApiError(502, "네이버에 연결하지 못했어요. 다시 시도해 주세요.");
  }
  if (response.status === 429) throw new ApiError(429, "요청이 많아요. 잠시 후 다시 시도해 주세요.");
  if (response.status === 401 || response.status === 403) throw new ApiError(502, "네이버 API 키나 이용 설정을 확인해 주세요.");
  if (response.status === 400) throw new ApiError(400, "요청 내용을 확인해 주세요.");
  if (!response.ok) throw new ApiError(502, "네이버 응답에 문제가 있어요. 다시 시도해 주세요.");
  try {
    return await response.json();
  } catch {
    throw new ApiError(502, "네이버 응답에 문제가 있어요. 다시 시도해 주세요.");
  }
}

export async function searchPlaces(query: string) {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) throw KEY_MISSING();
  const params = new URLSearchParams({ query, display: "5", start: "1", format: "json" });
  const body = await getJson(`${SEARCH_URL}?${params}`, { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret });
  return toPlaceResults(body?.items);
}
