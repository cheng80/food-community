"use client";
import { useSyncExternalStore } from "react";
import { SEED_NOW, type Restaurant, type User } from "./data";
import { sampleAppState } from "./sample-data";
export interface AppState {
  loggedIn: boolean;
  me: User;
  users: User[];
  restaurants: Restaurant[];
  loaded: boolean;
}
export type RestaurantInput = Pick<Restaurant, "title" | "address" | "content"> & { placeName: string; lat: number; lng: number; imagePaths: string[] };
const visitor: User = { id: "", nickname: "방문자" };
// 샘플 데이터는 동기로 준비되므로 서버 렌더부터 화면을 그린다.
const initial: AppState = { ...sampleAppState, loaded: true };
let state = initial;
const listeners = new Set<() => void>();
function set(next: AppState) { state = next; listeners.forEach((listener) => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useAppState() { return useSyncExternalStore(subscribe, () => state, () => initial); }
export function useHydrated() { return useAppState().loaded; }
const subscribeMinute = (listener: () => void) => { const timer = setInterval(listener, 60_000); return () => clearInterval(timer); };
export function useNow() { return useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000) * 60_000, () => SEED_NOW); }
export function findUser(s: AppState, id: string) { return s.me.id === id ? s.me : s.users.find((u) => u.id === id); }
const SAMPLE_ONLY = "샘플에서는 글을 저장하지 않아요.";
/** 04 샘플: 화면 흐름만 보여 준다. BFF 라우트(src/app/api)는 33과 같게 두고 호출하지 않으며 Supabase·env 없이 동작한다. */
export const actions = {
  async refresh() { set({ ...sampleAppState, loaded: true }); },
  async login(next: string) { set({ ...state, loggedIn: true, me: sampleAppState.me }); window.location.assign(next); },
  async logout() { set({ ...state, loggedIn: false, me: visitor }); },
  async updateProfile(input: { nickname: string; avatarUrl?: string }) {
    const me = { ...state.me, nickname: input.nickname, avatarUrl: input.avatarUrl ?? state.me.avatarUrl };
    set({ ...state, me, users: state.users.map((u) => (u.id === me.id ? me : u)) });
  },
  async createRestaurant(input: RestaurantInput): Promise<string> { void input; throw new Error(SAMPLE_ONLY); },
  async updateRestaurant(id: string, input: RestaurantInput) { void [id, input]; throw new Error(SAMPLE_ONLY); },
  async deleteRestaurant(id: string) { set({ ...state, restaurants: state.restaurants.filter((r) => r.id !== id) }); },
  async loadRestaurant(id: string) { void id; },
};
