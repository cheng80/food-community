import type { AppState } from "./store";

const HOUR = 3_600_000;
const base = Date.UTC(2026, 10, 3, 3);
const kalguksu = "/images/generated/kalguksu-v1.png";
const pajeon = "/images/generated/haemul-pajeon-v1.png";
const meId = "sample-me";
const neighborId = "sample-neighbor";

const place = (id: string, title: string, placeName: string, address: string, content: string, authorId: string, hoursAgo: number, photo: string) => ({
  id, title, placeName, address, content, authorId,
  lat: null, lng: null, photos: [photo], photoPaths: [], createdAt: base - hoursAgo * HOUR,
});

/** 04 샘플의 고정 데이터. 실제 사용자 데이터가 아니다. 좌표를 비워 외부 지도 SDK를 부르지 않는다. */
export const sampleAppState: Omit<AppState, "loaded"> = {
  loggedIn: true,
  me: { id: meId, nickname: "주말드라이버" },
  users: [{ id: meId, nickname: "주말드라이버" }, { id: neighborId, nickname: "맛집 이웃" }],
  restaurants: [
    place("s1", "샘플 · 광명 할매 손칼국수", "광명 할매 손칼국수", "경기도 광명시 광명동 12-3", "면이 쫄깃하고 국물이 진해요. 주차는 골목 안쪽에 두 대 정도 가능해요.", meId, 2, kalguksu),
    place("s2", "샘플 · 궁평항 옆 작은 백반집", "작은 백반집", "경기도 화성시 서신면 궁평리 45", "바다를 보며 먹는 백반이에요. 반찬이 매일 바뀝니다.", meId, 120, pajeon),
    place("s3", "샘플 · 오류동 시장 잔치국수", "오류시장 잔치국수", "서울특별시 구로구 오류동 78-1", "시장 안쪽의 오래된 국숫집이에요. 양이 넉넉해요.", meId, 144, kalguksu),
    place("s4", "샘플 · 부천 해물파전", "부천 해물파전", "경기도 부천시 심곡동 9-2", "해물이 가득한 파전과 막걸리가 잘 어울려요.", neighborId, 5, pajeon),
    place("s5", "샘플 · 금천 동네 칼제비", "금천 칼제비", "서울특별시 금천구 시흥동 200-4", "칼국수와 수제비를 한 그릇에 먹을 수 있어요.", neighborId, 30, kalguksu),
    place("s6", "샘플 · 영등포 골목 파전", "영등포 골목 파전", "서울특별시 영등포구 신길동 33-7", "비 오는 날 생각나는 골목 파전집이에요.", neighborId, 60, pajeon),
  ],
};
