# Vercel 배포 준비

아직 배포하지 않았다. 계정, 프로젝트, 공개 주소가 정해지면 `33-food-deploy-pwa`에서 아래 순서로 진행한다.

## 설정

- 프레임워크 Next.js, 빌드 `next build`, Node 24 (`package.json`의 `engines`), 함수 지역 Frankfurt `fra1` (`vercel.json`). Supabase 프로젝트 `npppyzvtktntjobjnliz`의 지역 Frankfurt(`eu-central-1`)에 맞췄다.
- 코드 저장소 연결 없이 CLI로 올릴 수 있다. Git 연결은 원격 push 승인 후 고른다.

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

`service_role`은 넣지 않는다. `NEXT_PUBLIC_` 값을 바꾸면 다시 빌드해야 한다.

`APP_URL`은 쓰기 요청의 Origin 검사와 OAuth 복귀 주소에 쓰인다. 값이 접속 주소와 다르면 쓰기가 403으로 막히므로, 주소마다 값이 달라지는 Preview 배포는 쓰기 검증에 쓰지 않고 Production 주소로 확인한다.

## 명령

```sh
cd 33-food-deploy-pwa
npx vercel login
npx vercel link
npx vercel deploy --prod
```

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
2. 정확히 10MB 사진 등록. 업로드는 4MB 조각이라 Vercel 4.5MB 요청 제한 아래이지만 **실제 Vercel과 Storage에서는 아직 검증하지 않았다.**
3. 장소 검색, 지도 드래그 주소, 상세 지도.
4. 휴대폰에서 설치 안내와 홈 화면 추가.
