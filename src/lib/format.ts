const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(ts: number, now: number) {
  const diff = Math.max(0, now - ts);
  if (diff < HOUR) return diff < MIN ? "방금 전" : `${Math.floor(diff / MIN)}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return formatDate(ts);
}

/** KST 고정 — 서버/브라우저 시간대가 달라도 같은 문자열 */
export function formatDate(ts: number) {
  const d = new Date(ts + 9 * HOUR);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

/** "경기 광명시 광명로 123번길 8" → "경기 광명시 광명로" */
export const shortAddress = (address: string) => address.split(" ").slice(0, 3).join(" ");

export function nicknameError(value: string) {
  const v = value.trim();
  if (!v) return "닉네임을 입력해 주세요.";
  const length = [...v].length; // DB char_length와 같은 코드포인트 기준
  if (length < 2 || length > 12) return "닉네임은 2~12자로 입력해 주세요.";
}

/** 로그인 후 돌아갈 경로 — 같은 사이트 내부 경로만 허용 */
export const safeNext = (next: string | null) => (next?.startsWith("/") && !/^\/[\\/]/.test(next) && !/[\u0000-\u0020\\]/.test(next) ? next : "/");
