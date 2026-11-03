"use client";
import { useSyncExternalStore } from "react";

export interface DraftPhoto {
  key: string;
  name: string;
  url?: string;
  /** Storage 경로. 업로드가 끝나면 채워진다. */
  path?: string;
  /** 이번 작성 중 올린 이미지인지. 기존 이미지는 저장 후 서버가 지운다. */
  draft: boolean;
  status: "uploading" | "complete" | "error";
}

export interface PlaceSelection {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RestaurantDraft {
  name: string;
  content: string;
  address: string;
  place: PlaceSelection | null;
  photos: DraftPhoto[];
}

// 폼과 장소 페이지가 공유하고, 페이지 이동이나 진행 중 업로드에도 남아야 하므로 모듈 상태로 둔다.
const drafts = new Map<string, RestaurantDraft>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export const getDraft = (key: string) => drafts.get(key);
export function clearDraft(key: string) { drafts.delete(key); notify(); }
export function updateDraft(key: string, patch: Partial<RestaurantDraft> | ((draft: RestaurantDraft) => Partial<RestaurantDraft>)) {
  const current = drafts.get(key);
  if (!current) return;
  drafts.set(key, { ...current, ...(typeof patch === "function" ? patch(current) : patch) });
  notify();
}

export function useDraft(key: string, init: () => RestaurantDraft) {
  const read = () => {
    if (!drafts.has(key)) drafts.set(key, init());
    return drafts.get(key)!;
  };
  return useSyncExternalStore(subscribe, read, read);
}
