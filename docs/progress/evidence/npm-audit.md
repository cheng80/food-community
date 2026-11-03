# npm audit 관련성 점검 (2026-11-03)

- `npm audit` (전체): moderate 20, high 0, critical 0. `audit --force`는 실행하지 않았다.
- `npm audit --omit=dev` (운영 의존성): **0건**.
- 20건 모두 `eslint`, `eslint-config-next`, `@storybook/nextjs-vite` 체인의 개발 도구다. 원인은 `minimatch` ReDoS(<11.0.1)와 `glob` AbortSignal 우회(>=9.0.0 <=14.0.1)다.
- 관련성: 공격자 입력을 받지 않는 로컬 lint·Storybook 빌드 경로이고 배포 번들에 포함되지 않는다. Next.js, Supabase, React 런타임에는 영향이 없다.
- 조치: 강제 업그레이드는 eslint 메이저와 Storybook 호환을 깨뜨릴 수 있어 보류한다. 해당 패키지 정상 릴리스 시 갱신한다.
