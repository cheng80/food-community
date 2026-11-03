# 숨은 맛집 커뮤니티

서울 구로 주변의 가족과 커플이 주말에 차로 갈 숨은 맛집을 찾고 공유하는 웹 서비스입니다. 부트캠프 학습 프로젝트이며 단계별 결과를 브랜치로 남겼습니다.

- 공개 앱: https://food-community-nine.vercel.app
- 기술: Next.js 16, React 19, Tailwind CSS 4, Supabase, 네이버 지도·검색 API, Storybook, PWA

> [!NOTE]
> `main`은 최종 단계 `33-food-deploy-pwa`의 `9e494ae` 위에 이 안내 문서 커밋을 더한 것입니다. 공개 앱은 `8c7fe0a`를 Vercel CLI로 올린 것이고 이 저장소와 연결되어 있지 않습니다. 저장소에 push해도 배포되지 않습니다.

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

DB는 `supabase/migrations/`의 migration 6개를 순서대로 적용합니다. 배포 절차는 [docs/deploy.md](docs/deploy.md), API 계약은 [docs/api-contract.md](docs/api-contract.md)에 있습니다.

```sh
npm run lint
npm test
npm run storybook
```

## 브랜치

Day55~61의 독립 학습 폴더마다 브랜치 하나를 두었습니다. `main` 끝의 문서 커밋을 뺀 모든 커밋은 원본 SHA 그대로입니다.

| 단계 | 브랜치 | 끝 커밋 | 내용 |
| --- | --- | --- | --- |
| 최종 | `main` | `9e494ae` + 문서 | 33. 실제 Supabase·Google·네이버 연동, Vercel 배포본의 소스 |
| Day55 | `stage/day55-social-login` | `68850a2` | 18. 데이터 설계와 Google 로그인 |
| Day56 | `stage/day56-profile-api` | `92e578e` | 19. 프로필 API |
| Day56 | `stage/day56-place-api` | `ca4eb0c` | 20. 맛집 CRUD API |
| Day56 | `stage/day56-soft-delete` | `dc2f85c` | 21. 소프트 삭제 |
| Day57 | `stage/day57-map-design` | `4208ffc` | 24. 지도 디자인과 Postman |
| Day58 | `stage/day58-handoff-map` | `79af19f` | 25. 지도 화면 핸드오프 |
| Day58 | `stage/day58-naver-map` | `a5f0985` | 27. 네이버 지도 SDK |
| Day58 | `stage/day58-local-search` | `4a2f19e` | 28. 지역 검색 BFF |
| Day58 | `stage/day58-reverse-geocoding` | `a551c33` | 29. Reverse Geocoding BFF |
| Day58 | `stage/day58-map-api` | `bfc6d3b` | 30. 장소명·좌표 저장 |
| Day59 | `stage/day59-deploy` | `ef63b9c` | 31. 배포 준비 |
| Day60 | `stage/day60-prd` | `e31d934` | 02. PRD v0.4 (유료 프로그램 기획) |
| Day61 | `stage/day61-design` | `ce56aac` | 03. 결제 Pencil 디자인과 배너 |
| Day61 | `stage/day61-handoff` | `d12e66b` | 04. 결제 샘플 8화면 (미배포) |

읽을 때 알아 둘 점입니다.

- 18~33은 한 줄기 이력을 공유합니다. 다만 각 폴더 끝의 package 이름 정리 커밋은 그 브랜치에만 있습니다.
- `stage/day60-prd`, `stage/day61-design`, `stage/day61-handoff`는 처음부터 따로 만든 저장소라 `main`과 공통 조상이 없습니다.
- Day55 이전 단계인 09~12 폴더의 커밋은 `stage/day55-social-login` 이력에 들어 있습니다. 그 이전의 Git 없는 폴더는 공개 범위가 아닙니다.
- 이전 커밋의 문서에 있는 "로컬에만 있음", "push하지 않음", "ZIP" 같은 표현은 그 시점의 기록입니다. SHA를 지키려고 고치지 않았습니다.

## Day별 제출과 검증

제출 URL과 문안은 [docs/progress/submission/README.md](docs/progress/submission/README.md)에 있고, 실제 연동 요약은 [docs/progress/evidence/](docs/progress/evidence/)에 있습니다. 실행 로그 원본은 공개하지 않았습니다.

| Day | 검증 범위 |
| --- | --- |
| 55~56 | 로컬 Postgres·PostgREST와 가짜 Auth·Storage 통합 테스트, 이후 실제 Supabase·Google 로그인 |
| 57~58 | Postman mock과 실제 네이버 호출, 단위·통합·브라우저 시나리오 |
| 59 | Production에서 로그인, 10MB 경계 업로드, 지도, 수정, 소프트 삭제, 로그아웃. 휴대폰 설치는 사용자 보고 |
| 60 | 문서 과제. 결제 코드 없음 |
| 61 | Pencil 렌더, 정확 규격 배너, 샘플 흐름. 실행 방법은 `stage/day61-handoff`의 `docs/day61/README.md` |

## 한계

- 사용자가 1명이라 타인 글 차단, 실제 세션 HttpOnly 속성은 실제 환경에서 확인하지 못했습니다. 실제 10MB 음식 사진, 스플래시 화면도 확인하지 않았습니다.
- 결제는 Day61 브랜치의 UI 샘플이며 `main`과 공개 앱에는 없습니다. 실제 결제와 환불은 일어나지 않고 가격·PG·환불 규정은 정하지 않았습니다.
- Day61: `Payment` 스토리 8개 통과. `Modal Busy` 스토리 1개 실패, 33 원본 `Overlay.tsx`에서도 같습니다.

## 보안

전체 이력의 파일 이름, 크기, 비밀 패턴, 실제 환경 값 일치 여부를 검사하고 공개했습니다. `.env`, 실제 키, 토큰, 쿠키, ZIP, `node_modules`, `.next`, `.vercel`은 이력에 없습니다. `.pen` 파일의 `fileToken`은 pen.dev가 파일별로 만든 임의 UUID이며 계정 인증 값이 아닙니다.
