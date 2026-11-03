export interface User {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export interface Restaurant {
  id: string;
  /** 글 제목. 장소 이름은 placeName이다. */
  title: string;
  /** 장소 이름. 좌표 도입 전 글은 null이다. */
  placeName: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
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
