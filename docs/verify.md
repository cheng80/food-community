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

포트 3100, 3101, 54397~54399를 쓴다. DB는 임시 폴더에 만들어 실행마다 초기화된다.
