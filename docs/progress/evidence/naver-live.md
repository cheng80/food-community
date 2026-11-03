# Naver 실제 호출 결과

2026-11-03. 사용자 승인 후 실행. `33-food-deploy-pwa/.env.local` 키 사용. 키·헤더·SDK URL·응답 본문은 기록하지 않았다. 호출: 검색 1회, Reverse 1회, SDK 지도 페이지 2회 로드.

| 대상 | 방법 | 결과 |
| --- | --- | --- |
| 지역 검색 | 실제 `searchPlaces("서울시청")` | HTTP 200, 원본 5건, 정규화 5건. `mapx` 10자리·`mapy` 9자리 정수(1e7배), 5건 모두 한국 좌표 범위 |
| Reverse | 위 첫 결과 좌표로 실제 `reverseAddress` | HTTP 200, `status.code` 0, 지번 조합 유효. 시/도·구·동은 검색 주소와 일치, 전체 주소 문자열은 불일치(원인 미조사) |
| 지도 SDK 인증 | `http://localhost:3100` 임시 페이지에서 실제 `NaverMap` + 실제 SDK | 인증 오류 표시·오류 코드 없음. 지도마다 타일 16개 로드(`nrbe.map.naver.net`), 지도·마커 화면 직접 확인 |
| 드래그·중심 이동 | 같은 페이지, 실제 마우스와 prop 변경 | 드래그: `center_changed` 10회, `idle` 1회, 중심 변경. `setCenter`: 지정 좌표와 1e-6 이내 |

## 결함과 수정

실제 SDK는 지도 생성 시 `idle`을 보내지 않았다(수정 전 두 지도 모두 0회). mock SDK는 보내므로 Day58 검증에서 드러나지 않았다. 코드상 지도에서 직접 고르기가 주소 확인 중에 멈춘다. 33 커밋 `384cf11`에서 생성 직후 첫 중심을 `onIdle`로 알리고 mock의 생성 시 `idle`을 지웠다. 수정 후 실제 SDK에서 두 지도 모두 첫 `idle` 콜백 1회를 확인했다. lint·tsc 통과, unit 76개 통과(커밋 직전 공백 한 칸 수정 전 실행).

## 미검증

- 없음(아래 실제 앱 연동에서 `/restaurants/place`와 BFF `/api/naver/*` 확인).
- 통합 stack, mock 브라우저 시나리오 재실행.
- 인증 실패 화면, Vercel 도메인.

## 실제 앱 연동 (2026-11-03, localhost 3000, 33 `02f1030`)

사용자가 Ego 기존 탭에서 직접 Google 로그인했고 이후 작업자가 같은 탭 UI로 확인했다. 쿠키·토큰·계정·본문은 조회·기록하지 않았다. DB 확인은 건수와 일치 여부만 읽었다.

| 항목 | 결과 |
| --- | --- |
| OAuth·가입 | 로그인 후 앱 복귀, bootstrap `loggedIn=true`. auth.users 1, profile 1, UUID 일치 1, 고아 0 |
| 프로필 | 현재 값과 같은 닉네임 PATCH 200, 값 변화 없음. 사진은 UI로 `kalguksu-v1.png` 첨부→실제 profile-image 저장(본인 폴더, image/png, 2,357,140바이트)→PATCH→화면 반영. 앱에 사진 제거 기능이 없어 MCP로 해당 행 image_path만 null 복원, 닉네임 일치. 테스트 객체 1개는 남아 공개 URL로 받을 수 있다 |
| 사진 교체 | 새 검증글(제목에 "검증용 AI 생성 이미지")에서 A `kalguksu-v1.png`→B `haemul-pajeon-v1.png` 수정 저장. DB 1행 position 0·경로 변경·B 크기 일치, 상세 표시. A 파일은 앱이 커밋 후 삭제, 이전 글 사진 3개 행·객체 유지. 이후 앱에서 소프트 삭제, BFF GET 404 |
| 10MB 경계 파일 | 앱 아이콘 PNG에 0을 덧붙인 10,485,760바이트 테스트 파일(음식 사진 아님). 조각 PUT 3건 200, place-image 1개 같은 크기, upload-chunk 0 |
| AI 사진 2장 | `kalguksu-v1.png` 2,357,140바이트, `haemul-pajeon-v1.png` 2,886,035바이트. 미리보기 2개, DB position 0·1이 선택 순서·크기와 일치. 앱에는 순서 변경 UI가 없다 |
| 장소 | 실검색 200(5건), 결과 선택과 지도 드래그 후 Reverse 200, 지번 표시. DB name·lat·lng 저장, 상세 실지도·마커 확인 |
| 수정 | 글 2개 텍스트 수정 저장, name·lat·lng·사진 유지 |
| 소프트 삭제 | 목록·마이페이지 제외, 상세 "없는 글입니다", 수정 "수정할 수 없는 글이에요", BFF GET·PATCH·DELETE 404(1번 글), 익명 Data API 0행. deleted_at 2건, 행과 사진 3개 유지 |
| 익명 차단 | 조회 200, 등록·수정·삭제와 RPC 401/42501 |

미검증(localhost 기준): 타인 글 차단, 실제 세션 HttpOnly 속성. 로그아웃과 실제 Vercel은 아래 표를 본다.

## 실제 Vercel Production (2026-11-03, `dpl_BP6v8ou7CjpMxYav8gSPT2sZ2RqP`, 소스 `8c7fe0a`)

| 항목 | 결과 |
| --- | --- |
| 배포 | READY, target production, `fra1`, Node 24.x, framework nextjs, alias `food-community-nine.vercel.app`이 `APP_URL`과 일치. 응답 헤더 함수 지역 `fra1` |
| 업로드 파일 | 387개, `.env`·`.vercel`·`.git`·`node_modules` 없음 |
| 공개 | bootstrap 200, `/`·`/login`·manifest·아이콘 200, 익명 쓰기·Naver BFF 401, 다른 Origin 403 |
| 로그인 | 기존 Google 세션·동의로 앱 복귀(외부감독이 버튼 클릭, 계정 선택 대행 없음), 기존 사용자 profile 1:1 유지, 새 사용자 없음 |
| 10MB 경계 | 앱 아이콘 PNG에 0을 덧붙인 10,485,760바이트 테스트 파일(음식 사진 아님). PUT 3건 200, 병합 POST 201, Storage 같은 크기, upload-chunk 0 |
| AI 사진 2장 | 각 2,357,140·2,886,035바이트, 미리보기 2개, DB position 0·1 일치. 10MB 경계 결과와 별개 |
| 장소 | 실제 SDK 지도, 검색 200, 드래그 후 Reverse 200, name·lat·lng 저장, 상세 지도·마커 |
| 수정·삭제 | 텍스트 수정 저장, 소프트 삭제 후 목록·마이페이지 제외, 상세·수정 차단, BFF GET·PATCH·DELETE 404 |
| PWA | Ego 데스크톱에서 manifest 오류 0, 설치 오류 0. 사용자 보고: 공개 앱을 휴대폰 홈 화면에 설치해 아이콘으로 정상 실행되는 것을 확인했고, 이어 글 1개를 직접 등록했다. 기기·OS·스플래시는 보고에 없어 미확인이다. |
| 로그아웃 | loggedIn=false, 보호 페이지 /login 이동, 쓰기·Naver BFF 401. Supabase 기본 global이라 auth.sessions 2→0, localhost 세션도 종료 |

미검증: 스플래시 화면, 기기·OS별 설치 차이, 타인 글 차단(사용자 1명), 실제 세션 HttpOnly 속성(쿠키 조회 금지), 실제 10MB 음식 사진, `supabase db push`. 검증 종료 당시 데이터(이후 사용자 글 제외): live 0, 소프트 삭제 글 5개, place-image 7개, profile-image 1개(공개 URL로 받을 수 있음).

관찰(코드 변경 없음): 자동화 중 `page.goto('/')`가 73초 지연됐다. 서버 응답은 36ms에 끝났고 리소스 요청은 CDP Debugger resume 직후 시작했다. 이후 다른 경로 이동은 재현되지 않았고 원인은 확정하지 못했다. 검색 결과를 고른 뒤 지도를 옮기면 장소명은 검색 결과 이름으로 남는다(입력 칸에서 고칠 수 있음).
