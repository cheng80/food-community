# 로컬 검증

키 없이 BFF 전체를 확인하는 방법이다. 실제 Supabase 연동을 대신하지 않는다.

| 대상 | 구성 | 구분 |
| --- | --- | --- |
| Next.js Route Handler, `@supabase/ssr`, 쿠키 | 실제 `next build`·`next start` | 로컬 실제 |
| migration, 제약, RLS, 트리거, RPC | 실제 Postgres + PostgREST | 로컬 실제 (Supabase 스키마는 스텁) |
| Google·Auth 서버(PKCE, 세션) | `tests/harness/stack.mjs` | 가짜 |
| Storage 서버 | 같은 파일, 정책은 Postgres에서 실행 | 가짜 |
| Vercel 4.5MB 요청 제한 | 같은 파일의 프록시 | 가짜 |

Docker가 없어도 된다. 도구는 프로젝트 의존성이 아니므로 저장소 밖에 설치한다.

```sh
mkdir -p "$VERIFY_TOOLS" && cd "$VERIFY_TOOLS"
npm init -y && npm i embedded-postgres@18.6.0-beta.19 pg@8.23.1
curl -L https://github.com/PostgREST/postgrest/releases/download/v16.5/postgrest-v16.5-macos-aarch64.tar.xz | tar xJ
```

```sh
npm run lint
npx next typegen && npx tsc --noEmit
npm test
VERIFY_TOOLS=... npm run test:stack
VERIFY_TOOLS=... node tests/harness/run.mjs --serve  # 브라우저 확인, http://localhost:3100
```

브라우저 확인은 `--serve`로 띄운 뒤 `http://localhost:3100`에서 한다. 구글 화면 없이 가짜 Auth가 바로 callback으로 돌려보낸다.

포트 3100, 3101, 54397~54399를 쓴다. DB는 임시 폴더에 만들어 실행마다 초기화된다.

지도를 확인할 때는 mock을 띄우고 빌드에 공개 ID와 SDK 주소를 넣는다. 실제 SDK 동작을 보증하지 않는다.

```sh
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=mock-id NEXT_PUBLIC_NAVER_MAP_SDK_URL=http://127.0.0.1:4610/openapi/v3/maps.js npx next build
```

공개 ID가 없는 빌드는 지도 대신 키 설정 안내를 표시한다.
