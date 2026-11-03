"use client";

/** 서울시청 부근(세종대로 110). 검색이나 수정 대상 좌표가 없을 때 첫 화면 중심으로만 쓴다. */
export const DEFAULT_CENTER = { lat: 37.5666103, lng: 126.9783882 };

const SDK_URL = process.env.NEXT_PUBLIC_NAVER_MAP_SDK_URL || "https://oapi.map.naver.com/openapi/v3/maps.js";
const KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
const LOAD_TIMEOUT = 10_000;

export const MAP_KEY_MISSING = "지도 키가 설정되지 않아 지도를 표시할 수 없어요.";

interface LatLng { lat(): number; lng(): number }
export interface NaverMapInstance {
  getCenter(): LatLng;
  setCenter(center: LatLng): void;
  destroy(): void;
}
export interface NaverMapsApi {
  LatLng: new (lat: number, lng: number) => LatLng;
  Map: new (element: HTMLElement, options: { center: LatLng; zoom: number }) => NaverMapInstance;
  Marker: new (options: { position: LatLng; map: NaverMapInstance }) => unknown;
  Event: {
    addListener(target: unknown, event: string, listener: () => void): unknown;
    removeListener(listener: unknown): void;
  };
}
declare global {
  interface Window {
    naver?: { maps?: NaverMapsApi };
    navermap_authFailure?: () => void;
  }
}

let loading: Promise<NaverMapsApi> | undefined;

/** 공개 ID로 SDK를 한 번만 불러온다. 실패하면 다음 호출에서 다시 시도한다. */
export function loadNaverMaps() {
  if (!KEY_ID) return Promise.reject(new Error(MAP_KEY_MISSING));
  loading ??= new Promise<NaverMapsApi>((resolve, reject) => {
    if (window.naver?.maps) return resolve(window.naver.maps);
    const fail = (message: string) => { loading = undefined; script.remove(); reject(new Error(message)); };
    const timer = setTimeout(() => fail("지도를 불러오지 못했어요. 다시 시도해 주세요."), LOAD_TIMEOUT);
    const script = document.createElement("script");
    script.src = `${SDK_URL}?ncpKeyId=${encodeURIComponent(KEY_ID)}`;
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      if (window.naver?.maps) resolve(window.naver.maps);
      else fail("지도를 불러오지 못했어요. 다시 시도해 주세요.");
    };
    script.onerror = () => { clearTimeout(timer); fail("지도를 불러오지 못했어요. 다시 시도해 주세요."); };
    document.head.append(script);
  });
  return loading;
}
