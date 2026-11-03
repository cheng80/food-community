"use client";
import { useSyncExternalStore } from "react";

export type InstallMode = "hidden" | "android" | "ios";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install-prompt-dismissed";

interface InstallWindow {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener?(type: string, listener: (event: Event) => void): void;
  matchMedia(query: string): { matches: boolean };
  navigator: { userAgent: string; maxTouchPoints?: number; standalone?: boolean };
  localStorage?: Pick<Storage, "getItem" | "setItem">;
}

/** iPhone·iPad의 Safari만 true. 다른 iOS 브라우저와 앱 내 브라우저는 안내해도 같은 메뉴가 없어 제외한다. */
export function isIosSafari({ userAgent, maxTouchPoints = 0 }: { userAgent: string; maxTouchPoints?: number }) {
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return ios && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|Whale|KAKAOTALK|NAVER|DaumApps|FBAN|Instagram/.test(userAgent);
}

/** 설치 안내 상태. 브라우저 이벤트가 화면 준비보다 먼저 올 수 있어 모듈에서 바로 듣는다. */
export function createInstallPrompt(win: InstallWindow) {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = win.matchMedia("(display-mode: standalone)").matches || win.navigator.standalone === true;
  let dismissed = false;
  try { dismissed = win.localStorage?.getItem(DISMISSED_KEY) === "1"; } catch { /* 저장소를 못 쓰면 이번 방문만 기억 */ }
  const ios = isIosSafari(win.navigator);
  const listeners = new Set<() => void>();
  let mode: InstallMode = "hidden";

  const update = () => {
    mode = installed || dismissed ? "hidden" : deferred ? "android" : ios ? "ios" : "hidden";
    listeners.forEach((listener) => listener());
  };
  win.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    update();
  });
  win.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    update();
  });
  update();

  return {
    getMode: () => mode,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** 브라우저 설치 창을 연다. 이벤트는 한 번만 쓸 수 있어 결과와 상관없이 버린다. */
    async install() {
      const event = deferred;
      if (!event) return;
      deferred = null;
      await event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === "accepted") installed = true;
      else dismissed = true;
      update();
    },
    dismiss() {
      dismissed = true;
      try { win.localStorage?.setItem(DISMISSED_KEY, "1"); } catch { /* 저장 실패 시 이번 방문만 숨김 */ }
      update();
    },
  };
}

const store = typeof window === "undefined" ? null : createInstallPrompt(window);
const noSubscribe = () => () => {};

export const useInstallMode = () => useSyncExternalStore(store?.subscribe ?? noSubscribe, () => store?.getMode() ?? "hidden", () => "hidden" as InstallMode);
export const installApp = () => store?.install() ?? Promise.resolve();
export const dismissInstall = () => store?.dismiss();
