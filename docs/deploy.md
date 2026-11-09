# Vercel 배포 준비

Day 64 Production 배포(2026-11-09): https://food-community-nine.vercel.app

- 팀 `virtues1`, 프로젝트 `food-community`, [배포 `dpl_DMc2HbjN9CzvMWCipLnieVZ88sQw`](https://vercel.com/virtues1/food-community/DMc2HbjN9CzvMWCipLnieVZ88sQw), 지역 `fra1`, Node 24.x, 소스 커밋 [`e42c144`](https://github.com/cheng80/food-community/commit/e42c144b78aee431384cfede8aff04a67e11b43f). Git 연결 없이 CLI로 올렸다.
- `APP_URL`은 위 주소다. 다른 alias `food-community-virtues1.vercel.app`은 `APP_URL`과 달라 쓰기 요청이 403이므로 안내하지 않는다.

다시 배포할 때는 이 저장소 루트를 소스로 사용한다. 학습 작업공간에서의 경로는 `publish/food-community`다.

## 설정

- 프레임워크 Next.js, 빌드 `next build`, Node 24 (`package.json`의 `engines`), 함수 지역 Frankfurt `fra1` (`vercel.json`). Supabase 프로젝트 `npppyzvtktntjobjnliz`의 지역 Frankfurt(`eu-central-1`)에 맞췄다.
- 현재 프로젝트는 Git과 연결되어 있지 않으므로 수동으로 배포한다.

## 환경변수

Vercel Project Settings > Environment Variables의 Production에 넣는다. `.env.local`은 올라가지 않는다.

| 변수 | 값 | 노출 |
| --- | --- | --- |
| `SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` | 서버 |
| `SUPABASE_PUBLISHABLE_KEY` | publishable key | 서버 |
| `SUPABASE_STORAGE_URL` | `https://<PROJECT_REF>.supabase.co/storage/v1/object/public` | 서버 |
| `APP_URL` | 실제 공개 주소, 예 `https://<도메인>` | 서버 |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | Maps Client ID | 브라우저와 서버, **빌드에 포함** |
| `NAVER_MAP_CLIENT_SECRET` | Maps Client Secret | 서버 |
| `NAVER_SEARCH_CLIENT_ID` | API HUB Client ID | 서버 |
| `NAVER_SEARCH_CLIENT_SECRET` | API HUB Client Secret | 서버 |
| `PORTONE_STORE_ID` | 포트원 상점 ID | 서버, Sensitive |
| `PORTONE_TEST_CHANNEL_KEY` | KG이니시스 V2 테스트 채널 키 | 서버, Sensitive |
| `PORTONE_API_SECRET` | 포트원 V2 API Secret | 서버, Sensitive |
| `SUPABASE_PAYMENT_SERVER_KEY` | 결제 준비·승인 기록용 Supabase 서버 키 | 서버, Sensitive |

일반 앱 요청용 `SUPABASE_PUBLISHABLE_KEY`에는 권한이 높은 키를 넣지 않는다. 결제 기록용 키는 `SUPABASE_PAYMENT_SERVER_KEY`로만 서버에서 읽는다. `NEXT_PUBLIC_` 값을 바꾸면 다시 빌드해야 한다.

`APP_URL`은 쓰기 요청의 Origin 검사와 OAuth 복귀 주소에 쓰인다. 값이 접속 주소와 다르면 쓰기가 403으로 막히므로, 주소마다 값이 달라지는 Preview 배포는 쓰기 검증에 쓰지 않고 Production 주소로 확인한다.

## 수동 배포

1. 배포할 GitHub `main` 커밋을 확인하고 `git archive`로 별도 디렉터리에 풀어 로컬 설정 파일과 작업 중인 변경을 배포 대상에서 뺀다.
2. 그 디렉터리를 `vercel link --yes --team virtues1 --project food-community`로 기존 프로젝트에 연결한다. Production 환경변수와 `APP_URL`을 확인한다.
3. `vercel deploy --prod --skip-domain --scope virtues1`로 빌드한다. `vercel inspect <배포 URL> --scope virtues1`에서 `READY`와 빌드 결과를 확인한다.
4. `vercel promote <배포 URL> --scope virtues1`로 기존 공개 주소를 전환한다. 공개 주소를 다시 조회해 새 배포 ID와 아래 동작을 확인한다.

## 도메인

구매는 하지 않는다. 기본 `*.vercel.app` 주소로 충분하다. 보유 도메인을 쓰면 Project Settings > Domains에 추가하고 Vercel 화면이 제시하는 레코드를 DNS에 넣는다. 레코드 값은 프로젝트마다 다르므로 문서에 미리 적지 않는다.

## 공개 주소가 정해지면 함께 바꿀 곳

| 위치 | 값 |
| --- | --- |
| Vercel `APP_URL` | `https://<주소>` |
| Supabase URL Configuration Site URL | `https://<주소>` |
| Supabase Redirect URLs | `https://<주소>/auth/callback` 추가 |
| Google OAuth Authorized JavaScript origins | `https://<주소>` 추가 |
| Google Authorized redirect URIs | 변경 없음 (Supabase callback 유지) |
| NCP Maps Web 서비스 URL | `https://<주소>` 추가 |

## 배포 후 확인

1. 비로그인 목록, 구글 로그인 후 원래 경로 복귀, 로그아웃.
2. 정확히 10MB 사진 등록. 업로드는 4MB 조각이라 Vercel 4.5MB 요청 제한 아래다. 실제 Vercel에서 10,485,760바이트 테스트 파일(PNG에 0을 덧붙인 파일)로 통과했다. 실제 10MB 음식 사진은 올려 보지 않았다.
3. 장소 검색, 지도 드래그 주소, 상세 지도.
4. 휴대폰에서 설치 안내와 홈 화면 추가. 사용자가 공개 앱을 휴대폰 홈 화면에 설치해 아이콘으로 정상 실행되는 것을 확인했고, 이어 글 1개를 직접 등록했다고 보고했다. 기기 종류와 스플래시 화면은 보고에 없어 확인하지 못했다.
5. Day 64: 공개 상품 목록·상세와 이미지, 비로그인 결제 차단, 다른 Origin 차단을 확인한다. 새 카드 승인이 필요한 경우 [핸드오프](day64/HANDOFF.md)의 결제 절차와 범위를 따른다.
