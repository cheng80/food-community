import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // 별도 Next.js 앱은 자체 설정으로 검사한다.
    "06-payment-link/**",
    // Postman mock은 CommonJS 핸들러로 실행된다.
    "postman/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
  ]),
]);

export default eslintConfig;
