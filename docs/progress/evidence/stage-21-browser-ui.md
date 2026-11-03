# 21단계 브라우저 UI 검증 (2026-11-03)

환경: ego lite TaskSpace 1개, Page 1개. `node tests/harness/run.mjs --serve` 로컬 스택(Next 프로덕션 빌드, 실제 Postgres·PostgREST, 가짜 Auth·Storage·ingress). live 아님.

| 시나리오 | 결과 |
| --- | --- |
| 비로그인 `맛집 올리기` → `/login?next=%2Frestaurants%2Fnew`, 로그인 → 원래 경로 복귀 | 통과 |
| 빈 폼 제출 → `필수 항목 4개`, 저장 없음 | 통과 |
| 위조 이미지(`forged.png` 실제 SVG 문자열) → 서버 거부 메시지, 조각 없음 | 통과 |
| 정확히 10MB jpg와 작은 jpg 동시 업로드 → 완료 표시, 조각 정리 | 통과 |
| 같은 틱 제출 버튼 3회 클릭 → DB `place` 1행, `place_image` 2행, 실제 UUID 상세로 이동 | 통과 |
| 수정 저장 503 주입 → 오류 토스트, 폼 유지, 재시도 성공 | 통과 |
| 프로필 사진 업로드·닉네임 저장 → 화면 반영, DB 경로 저장 | 통과 |
| 삭제 503 주입 → 오류 표시, 글 유지 | 통과 |
| 삭제 확인 2회 클릭 → 홈으로 이동, 목록·마이 페이지 제외 | 통과 |
| 삭제 글 상세 URL `없는 글입니다`, 수정 URL `수정할 수 없는 글이에요` | 통과 |
| DB에 `deleted_at` 기록, 이미지 행과 파일 보존 | 통과 |
| `document.cookie`에 `sb-*` 없음 (HttpOnly) | 통과 |
| 로그아웃 → `/me`가 로그인으로 이동 | 통과 |
| 레이아웃: viewport 1112px, 가로 넘침 없음 | 통과 |
| Storybook `Modal Busy`: 닫기·취소 disabled, 삭제 aria-busy (`npx storybook build` exit 0) | 통과 |

미확인: Storybook vitest(play 함수 전체) 일괄 실행은 Playwright 금지 지침으로 하지 않았다. 1280px 초과·모바일 폭 재확인과 실제 구글 화면은 하지 않았다.
