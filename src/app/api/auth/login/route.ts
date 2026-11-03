import { cookies } from "next/headers";
import { safeNext } from "@/lib/format";
import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { supabase } from "@/lib/server/supabase";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const body = await json(request);
    const next = safeNext(typeof body.next === "string" ? body.next : null);
    const jar = await cookies();
    jar.set("auth-next", next, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    const db = await supabase();
    const base = process.env.APP_URL || new URL(request.url).origin;
    const { data, error } = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${base}/auth/callback` } });
    if (error || !data.url) throw new ApiError(502, "구글 로그인 연결을 확인해 주세요.");
    return { url: data.url };
  });
}
