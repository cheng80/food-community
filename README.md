# 숨은 맛집 커뮤니티

서울 구로 주변의 가족과 커플이 주말에 차로 갈 숨은 맛집을 찾고 공유하는 웹 서비스입니다. 부트캠프 학습 프로젝트이며 단계별 결과를 커밋 이력으로 남겼습니다.

- 공개 앱: https://food-community-nine.vercel.app
- 기술: Next.js 16, React 19, Tailwind CSS 4, Supabase, 네이버 지도·검색 API, 포트원 V2, Storybook, PWA

> [!NOTE]
> 루트 앱은 `33-food-deploy-pwa`에 Day 64 상품 조회와 포트원 테스트 결제를 추가한 버전입니다. 공개 앱에는 구현 커밋 `e42c144`를 Vercel CLI로 배포했습니다. Vercel과 GitHub는 연결되어 있지 않아 push만으로는 배포되지 않습니다. [배포 절차](docs/deploy.md) · [Day 64 핸드오프](docs/day64/HANDOFF.md)

## 실행

Node.js 24가 필요합니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local`에 아래 값을 넣습니다. `.env.example`은 빈 값 안내이고 실제 값은 저장소에 없습니다.

| 변수 | 위치 | 설명 |
| --- | --- | --- |
| `SUPABASE_URL` | 서버 | Supabase 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 서버 | Publishable 키. `service_role`은 쓰지 않습니다 |
| `SUPABASE_STORAGE_URL` | 서버 | Storage 공개 URL |
| `APP_URL` | 서버 | 앱 주소. 기본값 `http://localhost:3000` |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 브라우저 공개 | NCP Maps 공개 식별자. 허용 도메인을 제한합니다 |
| `NAVER_MAP_CLIENT_SECRET` | 서버 비밀 | Reverse Geocoding |
| `NAVER_SEARCH_CLIENT_ID` | 서버 비밀 | 지역 검색 |
| `NAVER_SEARCH_CLIENT_SECRET` | 서버 비밀 | 지역 검색 |
| `PORTONE_STORE_ID` | 서버 설정 | 포트원 상점 ID |
| `PORTONE_TEST_CHANNEL_KEY` | 서버 설정 | KG이니시스 V2 테스트 채널 키 |
| `PORTONE_API_SECRET` | 서버 비밀 | 포트원 V2 API Secret |
| `SUPABASE_PAYMENT_SERVER_KEY` | 서버 비밀 | 결제 기록 전용 Supabase 서버 키 |

새 DB는 `supabase/migrations/`의 마이그레이션 9개를 순서대로 적용합니다. API 계약은 [docs/api-contract.md](docs/api-contract.md)에 있습니다.

```sh
npm run lint
npm test
npm run storybook
```

## 학습 이력

브랜치는 `main` 하나입니다. 단계별 커밋을 `main`의 선조 이력으로 보존했으므로 기존 제출 커밋 URL은 그대로 사용할 수 있습니다. 과거 단계의 실행 파일과 디자인은 각 커밋의 **Browse files**에서 확인합니다.

| Day | 커밋 | 내용 |
| --- | --- | --- |
| 55 | [02f1030](https://github.com/cheng80/food-community/commit/02f1030d3c3b66043db1cbf51727315cc0dfd558) | 데이터 설계·DB·Storage·권한 |
| 56 | [7baf5a6](https://github.com/cheng80/food-community/commit/7baf5a631832bf2c874a0e627608a10c1ff27f34) | 로그인·프로필·맛집 CRUD·소프트 삭제 BFF |
| 57 | [384dd77](https://github.com/cheng80/food-community/commit/384dd772076118bf5912c0a4a79db54c3db7f51a) | 지도 디자인·Postman |
| 58 | [baa5ec9](https://github.com/cheng80/food-community/commit/baa5ec9d0d64e4321569e4d6936d741057656cd7) | 지도·지역 검색·Reverse Geocoding |
| 59 | [9e494ae](https://github.com/cheng80/food-community/commit/9e494ae228faf2287850c500b5df6cc978f718e9) | 배포·PWA·실제 연동 확인 |
| 60 | [e31d934](https://github.com/cheng80/food-community/commit/e31d9344d67b8ac612593f64c0f715514bb83598) | PRD v0.4 |
| 61 | [디자인 ce56aac](https://github.com/cheng80/food-community/commit/ce56aacf8755ccc76fce8cc43baf19662bc96201), [핸드오프 d12e66b](https://github.com/cheng80/food-community/commit/d12e66b375e55b58f85b57bd777e303d78ad7e39) | 결제 화면·배너·8화면 UI 샘플 |
| 62 | [핸드오프 보완 d796a4a](https://github.com/cheng80/food-community/commit/d796a4aaa872966de0a3a85425160cdf7467c8d7), [결제 링크 소스](06-payment-link/README.md) | 디자인 핸드오프, 페이앱 팝업·QR, 실제 네이버페이 1,000원 결제완료 확인 |
| 64 | [e42c144](https://github.com/cheng80/food-community/commit/e42c144b78aee431384cfede8aff04a67e11b43f) | Day 63 설계 기반 상품 DB·이미지·조회, 포트원 V2 테스트 결제 |

이력 보존 병합은 현재 앱 파일을 유지합니다. Day61·62 핸드오프 샘플은 해당 커밋에서 확인합니다. Day62 결제 링크 실습은 `06-payment-link`에서 별도 실행하며 실제 결제 테스트를 완료했습니다. 공개 앱에는 반영하지 않았습니다. 이전 커밋의 문서에 있는 브랜치명, "로컬에만 있음", "push하지 않음", "ZIP" 표현은 그 시점의 기록입니다.

## Day별 제출과 검증

제출 URL과 설명은 [docs/progress/submission/README.md](docs/progress/submission/README.md)에 있고, 실제 연동 요약은 [docs/progress/evidence/](docs/progress/evidence/)에 있습니다. 실행 로그 원본은 공개하지 않았습니다.

| Day | 검증 범위 |
| --- | --- |
| 55~56 | 로컬 Postgres·PostgREST와 가짜 Auth·Storage 통합 테스트, 이후 실제 Supabase·Google 로그인 |
| 57~58 | Postman mock과 실제 네이버 호출, 단위·통합·브라우저 시나리오 |
| 59 | Production에서 로그인, 10MB 경계 업로드, 지도, 수정, 소프트 삭제, 로그아웃. 휴대폰 설치는 사용자 보고 |
| 60 | 문서 과제. 결제 코드 없음 |
| 61 | Pencil 렌더, 정확 규격 배너, 샘플 흐름. [Day61 실행 방법](https://github.com/cheng80/food-community/blob/d12e66b375e55b58f85b57bd777e303d78ad7e39/docs/day61/README.md) |
| 62 | [핸드오프 실행 방법과 증거](https://github.com/cheng80/food-community/blob/5c2079a919fb5012e7bb9ef5cde0e40881ef912d/docs/day62/README.md), [페이앱 연동·실제 결제 검증](06-payment-link/README.md) |
| 64 | [학습·검증 기록](docs/day64/README.md): 공개 상품 조회, 테스트 승인과 Supabase 기록, 포트원 전액 취소 및 네이버페이·카드사 웹 반영 |

## 한계

- 사용자가 1명이라 타인 글 차단, 실제 세션 HttpOnly 속성은 실제 환경에서 확인하지 못했습니다. 실제 10MB 음식 사진, 스플래시 화면도 확인하지 않았습니다.
- Day61·62 핸드오프의 결제·취소 내역은 UI 샘플입니다. 별도 `06-payment-link`는 실제 페이앱 1,000원 결제를 연결하며 환불·정산은 확인하지 않았습니다.
- 공개 앱의 Day 64 결제는 포트원 테스트 채널 전용입니다. 실제 카드 승인이 발생할 수 있습니다. 앱에는 취소 API와 웹훅이 없어 포트원에서 처리한 취소가 앱의 승인 이력에 자동 반영되지 않습니다.
- Day61: `Payment` 스토리 8개 통과. `Modal Busy` 스토리 1개 실패, 33 원본 `Overlay.tsx`에서도 같습니다.
- Day62: `Payment` 스토리 9개 통과. 같은 `Modal Busy` 1개는 계속 실패합니다. `design.pen`은 바꾸지 않아 버튼 문구와 취소 시트는 Storybook과 코드 기준입니다.

## 보안

전체 이력의 파일 이름, 크기, 비밀 패턴, 실제 환경 값 일치 여부를 검사하고 공개했습니다. `.env`, 실제 키, 토큰, 쿠키, ZIP, `node_modules`, `.next`, `.vercel`은 이력에 없습니다. `.pen` 파일의 `fileToken`은 pen.dev가 파일별로 만든 임의 UUID이며 계정 인증 값이 아닙니다.
