"use client";

import { useEffect, useRef, useState } from "react";
import { MapCenterPin } from "@/components/ui/Place";
import { Spinner } from "@/components/ui/Spinner";
import { cx } from "@/lib/cx";
import { loadNaverMaps, type NaverMapInstance, type NaverMapsApi } from "@/lib/naver-map";

export interface LatLngValue { lat: number; lng: number }

const AUTH_FAILED = "지도 인증에 실패했어요. 키와 허용 URL을 확인해 주세요.";

export interface NaverMapProps {
  /** 지도를 옮길 위치. 새 객체를 줄 때만 이동하므로 사용자가 드래그한 위치를 되돌리지 않는다. */
  center: LatLngValue;
  /** 상세의 미니지도처럼 좌표를 고정해 표시하는 핀 */
  marker?: boolean;
  /** 위치 선택용 중앙 고정 핀 */
  centerPin?: boolean;
  zoom?: number;
  /** 지도가 움직이기 시작했거나 중심이 바뀐 순간 */
  onCenterChange?: (center: LatLngValue) => void;
  /** 움직임이 끝난 순간 */
  onIdle?: (center: LatLngValue) => void;
  className?: string;
}

/** 실제 SDK 지도. 키가 없거나 불러오지 못하면 가짜 지도 대신 이유를 표시한다. */
export function NaverMap({ center, marker, centerPin, zoom = 16, onCenterChange, onIdle, className }: NaverMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<NaverMapInstance>(null);
  const api = useRef<NaverMapsApi>(null);
  const handlers = useRef({ onCenterChange, onIdle });
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);

  useEffect(() => { handlers.current = { onCenterChange, onIdle }; });

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    window.navermap_authFailure = () => setError(AUTH_FAILED);
    loadNaverMaps().then((maps) => {
      if (cancelled || !element.current) return;
      api.current = maps;
      const instance = new maps.Map(element.current, { center: new maps.LatLng(center.lat, center.lng), zoom });
      map.current = instance;
      if (marker) new maps.Marker({ position: new maps.LatLng(center.lat, center.lng), map: instance });
      const read = () => ({ lat: instance.getCenter().lat(), lng: instance.getCenter().lng() });
      const listeners = [
        maps.Event.addListener(instance, "center_changed", () => handlers.current.onCenterChange?.(read())),
        maps.Event.addListener(instance, "idle", () => handlers.current.onIdle?.(read())),
      ];
      setReady(true);
      // 실제 SDK는 지도를 처음 만들 때 idle을 보내지 않으므로 첫 중심을 멈춘 위치로 직접 알린다.
      handlers.current.onIdle?.(read());
      dispose = () => { listeners.forEach((listener) => maps.Event.removeListener(listener)); instance.destroy(); map.current = null; };
    }, (failure: Error) => { if (!cancelled) setError(failure.message); });
    return () => { cancelled = true; dispose(); };
    // 지도는 한 번만 만든다. 이후 좌표 변경은 아래 effect가 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (marker || !map.current || !api.current) return;
    const current = map.current.getCenter();
    if (Math.abs(current.lat() - center.lat) > 1e-7 || Math.abs(current.lng() - center.lng) > 1e-7) map.current.setCenter(new api.current.LatLng(center.lat, center.lng));
  }, [center, marker]);

  return (
    <div className={cx("relative overflow-hidden bg-background-subtle", className)}>
      <div ref={element} className="size-full" />
      {error ? (
        <p role="alert" className="body-md absolute inset-0 flex items-center justify-center p-(--spacing-20) text-center text-text-secondary">{error}</p>
      ) : !ready ? (
        <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>
      ) : centerPin ? (
        <MapCenterPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[47px]" />
      ) : null}
    </div>
  );
}
