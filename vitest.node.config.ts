import path from "node:path";
import { defineConfig } from "vitest/config";

const resolve = { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/harness/empty.ts") } };

// 브라우저가 필요 없는 테스트. Storybook 테스트는 vitest.config.ts가 맡는다.
export default defineConfig({
  test: {
    projects: [
      { resolve, test: { name: "unit", include: ["tests/unit/**/*.test.ts"] } },
      { resolve, test: { name: "e2e", include: ["tests/e2e/**/*.test.ts"], fileParallelism: false, testTimeout: 60_000 } },
    ],
  },
});
