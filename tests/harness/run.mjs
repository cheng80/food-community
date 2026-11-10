// `npm run test:stack`: 로컬 스택을 띄우고 e2e를 실행한다. --serve는 브라우저 확인용으로 유지한다.
import { spawn } from "node:child_process";
import path from "node:path";
import { ports, PORTONE_ENV, PUBLISHABLE_KEY, startStack } from "./stack.mjs";

const stop = await startStack();
const shutdown = async (code) => { await stop(); process.exit(code); };
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

if (process.argv.includes("--serve")) {
  console.log(`[stack] http://localhost:${ports.app} 준비 완료. Ctrl+C로 종료`);
} else {
  const vitest = spawn(path.join(process.cwd(), "node_modules/.bin/vitest"), ["run", "--config", "vitest.node.config.ts", "--project", "e2e", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, ...PORTONE_ENV, APP_URL: `http://localhost:${ports.app}`, GATEWAY_URL: `http://127.0.0.1:${ports.gateway}`, PUBLISHABLE_KEY },
  });
  vitest.on("exit", (code) => shutdown(code ?? 1));
}
