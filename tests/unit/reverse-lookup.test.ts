import { describe, expect, it, vi } from "vitest";
import { createReverseLookup, type ReverseState } from "@/lib/reverse-lookup";

function setup(initial?: { address: string; lat: number; lng: number }) {
  const calls: { lat: number; signal: AbortSignal; resolve: (v: string | null) => void; reject: (e: Error) => void }[] = [];
  const states: ReverseState[] = [];
  const fetcher = vi.fn((lat: number, _lng: number, signal: AbortSignal) => new Promise<string | null>((resolve, reject) => calls.push({ lat, signal, resolve, reject })));
  const lookup = createReverseLookup(fetcher, (s) => states.push(s), initial);
  return { calls, states, fetcher, lookup, last: () => states[states.length - 1] };
}
const A = { lat: 37.5, lng: 127 };
const B = { lat: 37.6, lng: 127.1 };
const flush = () => new Promise((r) => setTimeout(r));

describe("reverse 경합과 이전 주소 무효화", () => {
  it("좌표가 움직이면 응답 전이라도 이전 주소를 곧바로 버린다", async () => {
    const { calls, lookup, last } = setup();
    lookup.settled(A);
    calls[0].resolve("A 주소");
    await flush();
    expect(last()).toEqual({ status: "ok", address: "A 주소", ...A });
    lookup.moved(B);
    expect(last()).toEqual({ status: "loading" });
  });

  it("늦게 도착한 이전 응답은 버리고 이전 요청을 취소한다", async () => {
    const { calls, lookup, last } = setup();
    lookup.settled(A);
    lookup.settled(B);
    expect(calls[0].signal.aborted).toBe(true);
    calls[1].resolve("B 주소");
    await flush();
    calls[0].resolve("A 주소");
    await flush();
    expect(last()).toEqual({ status: "ok", address: "B 주소", ...B });
  });

  it("움직인 뒤 도착한 응답으로 주소가 되살아나지 않는다", async () => {
    const { calls, lookup, last } = setup();
    lookup.settled(A);
    lookup.moved(B);
    calls[0].resolve("A 주소");
    await flush();
    expect(last()).toEqual({ status: "loading" });
  });

  it("바다(null)와 API 실패는 ok가 되지 않는다", async () => {
    const { calls, lookup, last } = setup();
    lookup.settled(A);
    calls[0].resolve(null);
    await flush();
    expect(last()).toEqual({ status: "empty" });
    lookup.settled(B);
    calls[1].reject(new Error("요청이 많아요."));
    await flush();
    expect(last()).toEqual({ status: "error", message: "요청이 많아요." });
  });

  it("검색 선택 좌표로 지도가 이동해도 다시 조회하지 않는다", () => {
    const { fetcher, lookup, last } = setup();
    lookup.select({ address: "결과 주소", ...A });
    lookup.moved({ lat: A.lat + 1e-7, lng: A.lng });
    lookup.settled({ lat: A.lat + 1e-7, lng: A.lng });
    expect(fetcher).not.toHaveBeenCalled();
    expect(last()).toEqual({ status: "ok", address: "결과 주소", ...A });
    lookup.moved(B);
    expect(last()).toEqual({ status: "loading" });
  });

  it("직접 입력은 기존 주소를 버리고 같은 중심에서도 새로 찾는다", () => {
    const { fetcher, lookup, last } = setup({ address: "저장된 주소", ...A });
    lookup.clear();
    expect(last()).toEqual({ status: "loading" });
    lookup.settled(A);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("지도가 이미 멈춘 뒤 직접 입력을 눌러도 현재 중심을 다시 조회한다", async () => {
    const { calls, fetcher, lookup, last } = setup();
    lookup.settled(A);
    calls[0].resolve("A 주소");
    await flush();
    lookup.clear();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(last()).toEqual({ status: "loading" });
    calls[1].resolve("A 주소");
    await flush();
    expect(last()).toEqual({ status: "ok", address: "A 주소", ...A });
  });

  it("dispose 후 응답은 무시한다", async () => {
    const { calls, states, lookup } = setup();
    lookup.settled(A);
    lookup.dispose();
    const count = states.length;
    calls[0].resolve("A 주소");
    await flush();
    expect(states.length).toBe(count);
  });
});
