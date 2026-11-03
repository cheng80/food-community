import "server-only";
import { createServerClient } from "@supabase/ssr";
import { AuthSessionMissingError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ApiError } from "./http";

export async function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiError(503, "Supabase 연결 설정을 준비 중이에요.");
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}

/** 쿠키가 아니라 Auth 서버로 토큰을 검증한다 (getSession은 신뢰하지 않음). */
export async function currentUser() {
  const db = await supabase();
  const { data: { user }, error } = await db.auth.getUser();
  if (error && isAuthRetryableFetchError(error)) throw new ApiError(502, "로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.");
  // 위조·만료된 쿠키가 이후 공개 조회까지 401로 막지 않도록 지운다.
  if (error && !(error instanceof AuthSessionMissingError)) await db.auth.signOut({ scope: "local" });
  return { db, user };
}

export async function requireUser() {
  const { db, user } = await currentUser();
  if (!user) throw new ApiError(401, "로그인이 필요해요.");
  return { db, user };
}

export function publicImage(bucket: string, path: string | null) {
  if (!path) return undefined;
  const base = (process.env.SUPABASE_STORAGE_URL || `${process.env.SUPABASE_URL}/storage/v1/object/public`).replace(/\/$/, "");
  return `${base}/${bucket}/${path}`;
}
