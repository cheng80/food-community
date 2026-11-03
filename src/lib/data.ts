export interface User {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  content: string;
  /** 목록 카드 한 줄 소개 (없으면 content) */
  summary?: string;
  photos: string[];
  /** Storage 경로. 수정 저장 때 서버로 보낸다. */
  photoPaths: string[];
  authorId: string;
  /** epoch ms */
  createdAt: number;
}

const unsplash = (id: string, w = 1080) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=${w}`;

// design.pen 이미지 (01 메인 · 02 상세 · 04 로그인)
export const photos = {
  kalguksu: unsplash("1790703290407-c9b1495fab1b"),
  sujebi: unsplash("1623961989102-645c3e3d6b16"),
  dakgalbi: unsplash("1624420786331-e5a427e5972d"),
  pajeon: unsplash("1720499035798-e7706e507eb1"),
  baekban: unsplash("1616656899767-e11ba3872176"),
  wonton: unsplash("1763994685090-c0927ff195d1"),
  avatar: unsplash("1658678530179-5bc957a1e315", 200),
};

/** 서버 프리렌더와 첫 하이드레이션이 같은 값을 쓰도록 고정한 기준 시각 */
export const SEED_NOW = Date.UTC(2026, 9, 23, 3, 0);

/** 주소 검색 시연 데이터 (Day58 지도·검색 API로 교체) */
export const addressBook = [
  "경기 광명시 광명로 123번길 8",
  "경기 시흥시 동서로 287",
  "경기 부천시 원미구 부일로 45",
  "경기 안산시 단원구 대부황금로 17",
  "경기 화성시 서신면 궁평항로 1049",
  "서울 구로구 구로중앙로 152",
  "서울 구로구 디지털로 300",
  "서울 금천구 시흥대로 291",
  "경기 광명시 오리로 613",
  "경기 부천시 길주로 210",
  "경기 안산시 단원구 화랑로 387",
  "인천 남동구 소래역로 12",
];
