import { describe, expect, it, vi } from "vitest";
import { createInstallPrompt, isIosSafari } from "@/lib/install-prompt";

const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36";
const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IOS_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/131.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";

function setup({ userAgent = ANDROID, standalone = false, stored = null as string | null, maxTouchPoints = 0, storageThrows = false } = {}) {
  const events = new EventTarget();
  const setItem = vi.fn();
  const win = {
    addEventListener: (type: string, listener: (event: Event) => void) => events.addEventListener(type, listener),
    matchMedia: () => ({ matches: standalone }),
    navigator: { userAgent, maxTouchPoints },
    localStorage: { getItem: () => { if (storageThrows) throw new Error("denied"); return stored; }, setItem },
  };
  const fire = (outcome: "accepted" | "dismissed" = "accepted") => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome }) });
    events.dispatchEvent(event);
    return event;
  };
  return { prompt: createInstallPrompt(win), fire, events, setItem };
}

describe("설치 안내 상태", () => {
  it("지원 이벤트가 없으면 보이지 않는다", () => expect(setup().prompt.getMode()).toBe("hidden"));

  it("beforeinstallprompt를 보관하고 기본 안내를 막으며, 버튼을 눌러야 prompt한다", async () => {
    const { prompt, fire } = setup();
    const event = fire();
    expect(event.defaultPrevented).toBe(true);
    expect(event.prompt).not.toHaveBeenCalled();
    expect(prompt.getMode()).toBe("android");
    await prompt.install();
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(prompt.getMode()).toBe("hidden");
  });

  it("설치 창에서 거절하면 숨기고 다시 prompt하지 않는다", async () => {
    const { prompt, fire } = setup();
    const event = fire("dismissed");
    await prompt.install();
    await prompt.install();
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(prompt.getMode()).toBe("hidden");
  });

  it("appinstalled와 standalone이면 숨긴다", () => {
    const { prompt, fire, events } = setup();
    fire();
    events.dispatchEvent(new Event("appinstalled"));
    expect(prompt.getMode()).toBe("hidden");
    const installed = setup({ standalone: true });
    installed.fire();
    expect(installed.prompt.getMode()).toBe("hidden");
    expect(setup({ userAgent: IOS, standalone: true }).prompt.getMode()).toBe("hidden");
  });

  it("닫으면 기억하고 다음 방문에도 숨긴다. 저장소 오류에도 동작한다", () => {
    const { prompt, fire, setItem } = setup();
    fire();
    prompt.dismiss();
    expect(prompt.getMode()).toBe("hidden");
    expect(setItem).toHaveBeenCalledWith("install-prompt-dismissed", "1");
    const next = setup({ stored: "1" });
    next.fire();
    expect(next.prompt.getMode()).toBe("hidden");
    const denied = setup({ storageThrows: true });
    denied.fire();
    expect(denied.prompt.getMode()).toBe("android");
  });

  it("iOS Safari만 안내 모드다", () => {
    expect(setup({ userAgent: IOS }).prompt.getMode()).toBe("ios");
    expect(setup({ userAgent: IOS_CHROME }).prompt.getMode()).toBe("hidden");
    expect(setup({ userAgent: MAC }).prompt.getMode()).toBe("hidden");
    expect(isIosSafari({ userAgent: MAC, maxTouchPoints: 5 })).toBe(true);
    expect(isIosSafari({ userAgent: ANDROID })).toBe(false);
  });
});
