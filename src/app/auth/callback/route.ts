import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/format";
import { supabase } from "@/lib/server/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = process.env.APP_URL || url.origin;
  const jar = await cookies();
  const next = safeNext(jar.get("auth-next")?.value ?? null);
  jar.delete("auth-next");
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const db = await supabase();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, base));
    } catch { /* 로그인 화면에서 재시도 안내 */ }
  }
  return NextResponse.redirect(new URL(`/login?error=oauth&next=${encodeURIComponent(next)}`, base));
}
