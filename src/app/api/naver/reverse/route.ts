import { isLatitude, isLongitude } from "@/lib/naver-normalize";
import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { reverseAddress } from "@/lib/server/naver";
import { requireUser } from "@/lib/server/supabase";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    await requireUser();
    const { lat, lng } = await json(request);
    if (!isLatitude(lat) || !isLongitude(lng)) throw new ApiError(400, "좌표가 올바르지 않아요.");
    return { address: await reverseAddress(lat, lng) };
  });
}
