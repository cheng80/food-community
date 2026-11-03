@AGENTS.md

## Design SSOT

- Storybook(`src/**/*.stories.tsx`)이 디자인 SSOT다.
- 모든 UI 작업은 Storybook 스토리에 있는 컴포넌트(`src/components/ui`)와 토큰(`src/app/globals.css`)을 재사용한다.
- 새 UI가 필요하면 먼저 컴포넌트와 스토리를 추가한 뒤 사용한다.
- 색상·타이포·간격은 하드코딩하지 않고 토큰만 쓴다.

## Resolution

- 최대 너비 1280px(`max-w-page`), 초과 너비는 좌우 여백
- 목록은 반응형 카드 그리드: 1열 → `sm` 2열 → `lg` 3열 → `xl` 4열
- 상단·하단 내비게이션, 토스트, 하단 CTA도 1280px 안에서 정렬

## BFF
- 모든 Supabase API는 Next.js BFF(Route Handler)에서 호출한다.
- 브라우저는 `/api/*`만 호출하며 인증 토큰은 HttpOnly 쿠키에 저장한다.
- API 쓰기 요청은 서버 인증·소유권·입력 검증을 거친다.
- 비밀값은 `.env.local`에만 기록하고 커밋하지 않는다.
- 이미지는 4MB 조각으로 `/api/uploads`에 보낸다. 브라우저에서 Storage를 직접 호출하지 않는다. 계약은 `docs/api-contract.md`에 있다.
