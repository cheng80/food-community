"use client";
import { useSyncExternalStore } from "react";
import type { PaymentStatus } from "@/components/ui/Payment";

/** Day61 UI 샘플. 서버·PG·DB를 부르지 않고 브라우저 세션에만 저장한다. 가격과 규정은 정책 결정이 아니라 예시다. */
export interface Program {
  id: string;
  title: string;
  description: string;
  date: string;
  dateShort: string;
  place: string;
  price: number;
  count: number;
  capacity: number;
  hero: { mobile: string; desktop: string; alt: string };
  /** 식당과의 금전 관계 (PRD S2) */
  sponsor: string;
}

export interface Application {
  id: string;
  programId: string;
  status: PaymentStatus;
  method: string;
  cancelledOn?: string;
}

const NO_SPONSOR = "이 프로그램은 식당에서 비용이나 대가를 받지 않아요 (샘플 표기).";
const hero = (name: string, alt: string) => ({ mobile: `/images/generated/${name}`, desktop: `/images/generated/${name}`, alt });

export const programs: Program[] = [
  {
    id: "sushi-bento",
    title: "초밥 도시락 쿠킹 클래스",
    description: "주말 오후, 이웃과 함께 초밥 다섯 가지와 소스 두 가지를 만들어 도시락에 담아 갑니다. 재료와 도구는 모두 준비되어 있어요.",
    date: "2026년 11월 21일 (토) 오후 2시",
    dateShort: "11월 21일 (토) 오후 2시",
    place: "구로 쿠킹 스튜디오 (샘플)",
    price: 35000,
    count: 7,
    capacity: 12,
    hero: { mobile: "/images/program/hero-720x360.png", desktop: "/images/program/hero-2480x806.png", alt: "주황색 도시락과 초밥, 소스 그릇 두 개" },
    sponsor: NO_SPONSOR,
  },
  {
    id: "pajeon-meetup",
    title: "숨은 파전집 이야기 모임",
    description: "이웃이 찾은 파전집에서 만나 맛집을 고르는 기준을 나눕니다.",
    date: "2026년 11월 28일 (토) 오전 11시",
    dateShort: "11월 28일 (토) 오전 11시",
    place: "구로구 식당 (샘플)",
    price: 20000,
    count: 5,
    capacity: 10,
    hero: hero("haemul-pajeon-v1.png", "해물파전 사진"),
    sponsor: NO_SPONSOR,
  },
  {
    id: "kalguksu-talk",
    title: "칼국수 한 그릇 강연",
    description: "칼국수 맛집을 찾아다닌 이웃의 짧은 강연입니다.",
    date: "2026년 12월 5일 (토) 오전 10시",
    dateShort: "12월 5일 (토) 오전 10시",
    place: "광명 커뮤니티룸 (샘플)",
    price: 15000,
    count: 4,
    capacity: 20,
    hero: hero("kalguksu-v1.png", "칼국수 사진"),
    sponsor: NO_SPONSOR,
  },
  {
    id: "drive-meetup",
    title: "주말 드라이브 맛집 모임",
    description: "차로 한 시간 안의 맛집을 함께 다녀옵니다. 정원이 찬 상태를 보여 주는 예시예요.",
    date: "2026년 12월 12일 (토) 오전 10시",
    dateShort: "12월 12일 (토) 오전 10시",
    place: "구로역 집결 (샘플)",
    price: 25000,
    count: 12,
    capacity: 12,
    hero: hero("kalguksu-v1.png", "칼국수 사진"),
    sponsor: NO_SPONSOR,
  },
];

export const findProgram = (id: string) => programs.find((p) => p.id === id);
export const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

const seed: Application[] = [
  { id: "pajeon-meetup-0", programId: "pajeon-meetup", status: "paid", method: "샘플 카드" },
  { id: "kalguksu-talk-0", programId: "kalguksu-talk", status: "cancelled", method: "샘플 카드", cancelledOn: "11월 1일" },
  { id: "drive-meetup-0", programId: "drive-meetup", status: "refund_failed", method: "샘플 간편결제", cancelledOn: "11월 2일" },
];

const KEY = "day61-payment-sample";
let state: Application[] | undefined;
const listeners = new Set<() => void>();

function read() {
  if (state) return state;
  try {
    const saved = sessionStorage.getItem(KEY);
    state = saved ? (JSON.parse(saved) as Application[]) : seed;
  } catch {
    state = seed;
  }
  return state;
}

function write(next: Application[]) {
  state = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ponytail: 저장소를 못 쓰면 이 탭의 메모리에만 남는다. 샘플이라 충분하다.
  }
  listeners.forEach((listener) => listener());
}

export const readApplications = read;

export function usePaymentSample() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read,
    () => seed,
  );
}

export const activeApplication = (apps: Application[], programId: string) => apps.find((a) => a.programId === programId && a.status === "paid");

/** 시드의 정원 수에 이번 세션의 샘플 결제를 더한다. 시드 신청은 count에 이미 포함되어 있다. */
export const currentCount = (apps: Application[], program: Program) =>
  program.count + apps.filter((a) => a.programId === program.id && a.status === "paid" && !seed.some((s) => s.id === a.id)).length;

export const sampleActions = {
  /** 회차당 진행 중 신청 1개, 정원 초과 금지 (PRD 중복 결제·정원 경합의 UI 예시). 성공하면 신청을, 마감이면 undefined를 준다. */
  pay(programId: string, method: string) {
    const apps = read();
    const program = findProgram(programId);
    const existing = activeApplication(apps, programId);
    if (existing) return existing;
    if (!program || currentCount(apps, program) >= program.capacity) return undefined;
    const application: Application = { id: `${programId}-${apps.length}`, programId, status: "paid", method };
    write([application, ...apps]);
    return application;
  },
  /** 같은 신청을 두 번 취소해도 상태는 한 번만 바뀐다. */
  cancel(id: string) {
    const apps = read();
    if (!apps.some((a) => a.id === id && a.status === "paid")) return;
    const cancelledOn = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" });
    write(apps.map((a) => (a.id === id ? { ...a, status: "cancelled" as const, cancelledOn } : a)));
  },
};
