"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toast, type ToastProps } from "@/components/ui/Feedback";
import { actions, useAppState, useHydrated } from "@/lib/store";

let loggingOut = false;

/** 로그인 필요 페이지 — 비로그인이면 /login?next=현재경로 */
export function useRequireLogin() {
  const { loggedIn } = useAppState();
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (hydrated && !loggedIn && !loggingOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, loggedIn, pathname, router]);
  return hydrated && loggedIn;
}

export const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** 비동기 작업 진행 표시와 중복 실행 방지 — 같은 틱의 연속 클릭도 막도록 ref로 잠금 */
export function useBusy() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try { await task(); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  return { busy, run };
}

/** 로그아웃 후 홈으로 — 보호 페이지의 로그인 리다이렉트와 겹치지 않게 */
export function useLogout() {
  const router = useRouter();
  return useCallback(async () => {
    if (loggingOut) return;
    loggingOut = true;
    try { await actions.logout(); router.replace("/"); }
    catch (error) { window.alert(errorMessage(error, "로그아웃에 실패했어요.")); }
    finally { setTimeout(() => (loggingOut = false), 1000); }
  }, [router]);
}

/** 히스토리가 없으면(직접 진입) 홈으로 */
export function useBack(fallback = "/") {
  const router = useRouter();
  return useCallback(() => (window.history.length > 1 ? router.back() : router.push(fallback)), [router, fallback]);
}

type Flash = Pick<ToastProps, "variant" | "message">;

/** 잠깐 떠 있는 토스트 — 상단 내비 아래, max-w-page 컨테이너 안에서 최대 400px */
export function useFlashToast() {
  const [flash, setFlash] = useState<Flash | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((next: Flash) => {
    clearTimeout(timer.current);
    setFlash(next);
    timer.current = setTimeout(() => setFlash(null), 2500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const toast = flash && (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40">
      <div className="mx-auto flex w-full max-w-page justify-center px-(--spacing-20)">
        <Toast {...flash} onClose={() => setFlash(null)} className="pointer-events-auto sm:w-[400px]" />
      </div>
    </div>
  );
  return { show, toast };
}
