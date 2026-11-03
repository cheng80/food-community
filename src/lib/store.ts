"use client";
import { useSyncExternalStore } from "react";
import { SEED_NOW, type Restaurant, type User } from "./data";
import { request, send } from "./api";
export interface AppState {
  loggedIn: boolean;
  me: User;
  users: User[];
  restaurants: Restaurant[];
  loaded: boolean;
}
export type RestaurantInput = Pick<Restaurant, "name" | "address" | "content" | "photos">;
const initial: AppState = { loggedIn: false, me: { id: "", nickname: "방문자" }, users: [], restaurants: [], loaded: false };
let state = initial;
let refreshSeq = 0;
const listeners = new Set<() => void>();
function set(next: AppState) { state = next; listeners.forEach((listener) => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useAppState() { return useSyncExternalStore(subscribe, () => state, () => initial); }
export function useHydrated() { return useAppState().loaded; }
const subscribeMinute = (listener: () => void) => { const timer = setInterval(listener, 60_000); return () => clearInterval(timer); };
export function useNow() { return useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000) * 60_000, () => SEED_NOW); }
export function findUser(s: AppState, id: string) { return s.me.id === id ? s.me : s.users.find((u) => u.id === id); }
/** 이미 성공한 쓰기를 목록 갱신 실패 때문에 실패로 보이지 않게 함 */
const refreshAfterWrite = () => actions.refresh().catch(() => undefined);
/** 이 단계에 없는 쓰기 API는 성공처럼 보이지 않게 실패로 알림 */
const notReady = <A extends unknown[], R = void>(feature: string): ((...args: A) => Promise<R>) => () => Promise.reject(new Error(`${feature} 기능은 아직 연결되지 않았어요.`));
export const actions = {
  async refresh() {
    const seq = ++refreshSeq;
    const next = await request<Omit<AppState, "loaded">>("/api/bootstrap");
    if (seq === refreshSeq) set({ ...next, loaded: true });
  },
  async login(next: string) { const result = await send<{ url: string }>("/api/auth/login", "POST", { next }); window.location.assign(result.url); },
  async logout() {
    await send("/api/auth/logout", "POST");
    set({ ...state, loggedIn: false, me: initial.me });
    await refreshAfterWrite();
  },
  updateProfile: notReady<[{ nickname: string }]>("프로필 저장"),
  createRestaurant: notReady<[RestaurantInput], string>("맛집 등록"),
  updateRestaurant: notReady<[string, RestaurantInput]>("맛집 수정"),
  deleteRestaurant: notReady<[string]>("맛집 삭제"),
};
