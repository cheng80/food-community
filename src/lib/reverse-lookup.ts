export type ReverseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; address: string; lat: number; lng: number }
  | { status: "empty" }
  | { status: "error"; message: string };

type Fetcher = (lat: number, lng: number, signal: AbortSignal) => Promise<string | null>;
interface Known { address: string; lat: number; lng: number }

/** 같은 위치로 보는 오차. SDK가 돌려주는 좌표의 반올림을 흡수한다(약 10cm). */
const SAME = 1e-6;
const same = (known: Known | undefined, lat: number, lng: number) => !!known && Math.abs(known.lat - lat) < SAME && Math.abs(known.lng - lng) < SAME;

/**
 * 지도 중심과 주소의 짝을 지키는 상태 기계.
 * 중심이 움직이면 곧바로 이전 주소를 버려 CTA를 막고, 멈춘 뒤 새 주소를 찾는다.
 * 앞선 요청은 취소하며 늦게 도착한 응답은 버린다.
 */
export function createReverseLookup(fetcher: Fetcher, onState: (state: ReverseState) => void, initial?: Known) {
  let known = initial;
  let control: AbortController | undefined;
  let seq = 0;

  const cancel = () => { seq++; control?.abort(); control = undefined; };

  return {
    /** 검색 결과 선택: 결과의 지번 주소와 좌표를 그대로 쓴다. */
    select(place: Known) {
      cancel();
      known = { address: place.address, lat: place.lat, lng: place.lng };
      onState({ status: "ok", ...known });
    },
    /** 직접 입력: 기존 주소를 버리고 현재 중심의 주소를 찾게 한다. */
    clear() {
      cancel();
      known = undefined;
      onState({ status: "loading" });
    },
    /** 중심이 바뀐 순간 */
    moved(center: { lat: number; lng: number }) {
      if (same(known, center.lat, center.lng)) return;
      cancel();
      known = undefined;
      onState({ status: "loading" });
    },
    /** 움직임이 멈춘 순간 */
    settled(center: { lat: number; lng: number }) {
      if (same(known, center.lat, center.lng)) return;
      cancel();
      known = undefined;
      const mine = ++seq;
      control = new AbortController();
      onState({ status: "loading" });
      fetcher(center.lat, center.lng, control.signal).then(
        (address) => {
          if (mine !== seq) return;
          if (!address) return onState({ status: "empty" });
          known = { address, lat: center.lat, lng: center.lng };
          onState({ status: "ok", ...known });
        },
        (error: unknown) => {
          if (mine !== seq) return;
          onState({ status: "error", message: error instanceof Error ? error.message : "주소를 확인하지 못했어요." });
        },
      );
    },
    dispose: cancel,
  };
}
