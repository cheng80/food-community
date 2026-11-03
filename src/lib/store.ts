"use client";
import { useSyncExternalStore } from "react";
import { SEED_NOW, type Restaurant, type User } from "./data";
import { request, RequestError, send } from "./api";
export interface AppState {
  loggedIn: boolean;
  me: User;
  users: User[];
  restaurants: Restaurant[];
  loaded: boolean;
}
export type RestaurantInput = Pick<Restaurant, "name" | "address" | "content"> & { imagePaths: string[] };
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
  async updateProfile(input: { nickname: string; imagePath?: string }) {
    await send("/api/profile", "PATCH", input);
    await refreshAfterWrite();
  },
  async createRestaurant(input: RestaurantInput) {
    const { id } = await send<{ id: string }>("/api/restaurants", "POST", input);
    await refreshAfterWrite();
    return id;
  },
  async updateRestaurant(id: string, input: RestaurantInput) {
    await send(`/api/restaurants/${id}`, "PATCH", input);
    await refreshAfterWrite();
  },
  async deleteRestaurant(id: string) {
    await send(`/api/restaurants/${id}`, "DELETE");
    set({ ...state, restaurants: state.restaurants.filter((r) => r.id !== id) });
    await refreshAfterWrite();
  },
  /** 다른 곳에서 삭제·수정된 글을 상세 화면에 반영한다. 없는 글이면 목록에서도 뺀다. */
  async loadRestaurant(id: string) {
    try {
      const restaurant = await request<Restaurant>(`/api/restaurants/${id}`);
      set({ ...state, restaurants: state.restaurants.some((r) => r.id === id) ? state.restaurants.map((r) => (r.id === id ? restaurant : r)) : [restaurant, ...state.restaurants] });
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) set({ ...state, restaurants: state.restaurants.filter((r) => r.id !== id) });
      else throw error;
    }
  },
};
