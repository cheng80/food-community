import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { searchPlaces } from "@/lib/server/naver";
import { requireUser } from "@/lib/server/supabase";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    await requireUser();
    const { query } = await json(request);
    const text = typeof query === "string" ? query.trim() : "";
    if (!text || text.length > 100) throw new ApiError(400, "검색어를 1~100자로 입력해 주세요.");
    return { results: await searchPlaces(text) };
  });
}
