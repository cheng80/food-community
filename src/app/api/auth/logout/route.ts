import { api, ApiError, checkOrigin } from "@/lib/server/http";
import { supabase } from "@/lib/server/supabase";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const { error } = await (await supabase()).auth.signOut();
    if (error) throw new ApiError(502, "로그아웃하지 못했어요. 다시 시도해 주세요.");
    return { ok: true };
  });
}
