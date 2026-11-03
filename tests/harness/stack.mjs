// 키 없이 BFF를 끝까지 검증하는 로컬 스택.
// 실제: Postgres + migration + RLS + PostgREST. 가짜: Auth(PKCE) + Storage HTTP + Vercel 4.5MB ingress.
// 도구는 프로젝트 의존성이 아니다. VERIFY_TOOLS에 embedded-postgres, pg, postgrest를 둔다 (docs/verify.md).
import { spawn, spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const tools = process.env.VERIFY_TOOLS;
if (!tools) throw new Error("VERIFY_TOOLS 경로가 필요해요 (docs/verify.md)");
const pg = createRequire(path.join(tools, "package.json"))("pg");
const native = path.join(tools, "node_modules/@embedded-postgres", readdirSync(path.join(tools, "node_modules/@embedded-postgres"))[0], "native");

export const ports = { pg: 54398, rest: 54397, gateway: 54399, next: 3101, app: 3100 };
export const JWT_SECRET = "local-verify-secret-local-verify-secret-0123";
export const PUBLISHABLE_KEY = "sb_publishable_local_verify";
const INGRESS_LIMIT = 4.5 * 1024 * 1024;
const root = process.cwd();
const children = [];
const b64url = (v) => Buffer.from(v).toString("base64url");
const sign = (claims) => {
  const head = `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  return `${head}.${createHmac("sha256", JWT_SECRET).update(head).digest("base64url")}`;
};
function verify(token) {
  const [h, c, s] = String(token).split(".");
  if (!s || createHmac("sha256", JWT_SECRET).update(`${h}.${c}`).digest("base64url") !== s) return null;
  const claims = JSON.parse(Buffer.from(c, "base64url"));
  return claims.exp > Date.now() / 1000 ? claims : null;
}
const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c)).on("end", () => resolve(Buffer.concat(chunks))).on("error", reject);
});
function reply(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function startPostgres() {
  const dir = mkdtempSync(path.join(tmpdir(), "food-verify-pg-"));
  const env = { ...process.env, DYLD_FALLBACK_LIBRARY_PATH: path.join(native, "lib"), LC_ALL: "en_US.UTF-8" };
  const init = spawnSync(path.join(native, "bin/initdb"), ["-D", dir, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C"], { env, encoding: "utf8" });
  if (init.status) throw new Error(init.stderr);
  const server = spawn(path.join(native, "bin/postgres"), ["-D", dir, "-p", String(ports.pg), "-k", dir, "-c", "listen_addresses=127.0.0.1"], { env, stdio: "ignore" });
  children.push(server);
  const pool = new pg.Pool({ host: "127.0.0.1", port: ports.pg, user: "postgres", database: "postgres", max: 8 });
  for (let i = 0; ; i++) {
    try { await pool.query("select 1"); break; }
    catch (error) { if (i > 100) throw error; await new Promise((r) => setTimeout(r, 100)); }
  }
  return { pool, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

async function migrate(pool) {
  const stub = readFileSync(path.join(root, "tests/harness/supabase-stub.sql"), "utf8");
  await pool.query(stub);
  const dir = path.join(root, "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await pool.query(readFileSync(path.join(dir, file), "utf8"));
    console.log(`[stack] migration 적용: ${file}`);
  }
}

function startRest() {
  const child = spawn(path.join(tools, "postgrest"), [], {
    stdio: "ignore",
    env: {
      ...process.env,
      DYLD_FALLBACK_LIBRARY_PATH: path.join(native, "lib"),
      PGRST_DB_URI: `postgres://authenticator@127.0.0.1:${ports.pg}/postgres`,
      PGRST_DB_SCHEMAS: "public",
      PGRST_DB_ANON_ROLE: "anon",
      PGRST_JWT_SECRET: JWT_SECRET,
      PGRST_SERVER_PORT: String(ports.rest),
      PGRST_SERVER_HOST: "127.0.0.1",
    },
  });
  children.push(child);
}

function gateway(pool) {
  const anonJwt = sign({ role: "anon", exp: Math.floor(Date.now() / 1000) + 86400 });
  const codes = new Map(); // code → { challenge, user, ttl }
  const refreshTokens = new Map(); // token → { user, session }
  const revoked = new Set();
  const blobs = new Map(); // bucket/name → { bytes, mimetype }
  let failures = [];
  let log = [];

  async function findUser(email, fullName) {
    const { rows } = await pool.query(
      "insert into auth.users (email, raw_user_meta_data) values ($1, $2) on conflict (email) do update set email = excluded.email returning id, email",
      [email, JSON.stringify(fullName ? { full_name: fullName } : {})],
    );
    return rows[0];
  }
  function issue(user, ttl = 3600, session = randomUUID()) {
    const now = Math.floor(Date.now() / 1000);
    const refresh = randomBytes(16).toString("hex");
    refreshTokens.set(refresh, { user, session });
    return {
      access_token: sign({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", session_id: session, exp: now + ttl }),
      token_type: "bearer",
      expires_in: ttl,
      expires_at: now + ttl,
      refresh_token: refresh,
      user: { id: user.id, aud: "authenticated", role: "authenticated", email: user.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    };
  }
  async function asRole(claims, run) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('role', $1, true), set_config('request.jwt.claims', $2, true)", [claims?.role ?? "anon", JSON.stringify(claims ?? {})]);
      const result = await run(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  const claimsOf = (req) => {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token || token === PUBLISHABLE_KEY) return { role: "anon" };
    const claims = verify(token);
    return claims && !revoked.has(claims.session_id) ? claims : null;
  };
  const storageError = (res, http, statusCode, message) => reply(res, http, { statusCode, error: message, message });

  async function auth(req, res, url, body) {
    const route = url.pathname.replace("/auth/v1", "");
    if (route === "/authorize") {
      const redirect = url.searchParams.get("redirect_to");
      if (url.searchParams.get("provider") !== "google") return reply(res, 400, { msg: "unsupported provider" });
      if (redirect !== `http://localhost:${ports.app}/auth/callback`) return reply(res, 400, { msg: "redirect_to not allowed" });
      if (url.searchParams.get("code_challenge_method")?.toLowerCase() !== "s256") return reply(res, 400, { msg: "pkce required" });
      const code = randomUUID();
      codes.set(code, { challenge: url.searchParams.get("code_challenge"), user: await findUser(url.searchParams.get("test_user") ?? "browser@example.test"), ttl: Number(url.searchParams.get("test_ttl") ?? 3600) });
      res.writeHead(302, { location: `${redirect}?code=${code}` });
      return res.end();
    }
    if (route === "/token") {
      const input = JSON.parse(body.toString() || "{}");
      if (url.searchParams.get("grant_type") === "pkce") {
        const entry = codes.get(input.auth_code);
        codes.delete(input.auth_code);
        const expected = entry && createHash("sha256").update(String(input.code_verifier)).digest("base64url");
        if (!entry || expected !== entry.challenge) return reply(res, 400, { code: 400, error_code: "bad_code_verifier", msg: "invalid flow state" });
        return reply(res, 200, issue(entry.user, entry.ttl));
      }
      const entry = refreshTokens.get(input.refresh_token);
      if (!entry || revoked.has(entry.session)) return reply(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
      return reply(res, 200, issue(entry.user, 3600, entry.session));
    }
    if (route === "/user") {
      const claims = claimsOf(req);
      if (!claims?.sub) return reply(res, 403, { code: 403, error_code: "bad_jwt", msg: "invalid JWT" });
      return reply(res, 200, { id: claims.sub, aud: "authenticated", role: "authenticated", email: claims.email, app_metadata: {}, user_metadata: {} });
    }
    if (route === "/logout") {
      const claims = claimsOf(req);
      if (!claims?.sub) return reply(res, 403, { code: 403, error_code: "bad_jwt", msg: "invalid JWT" });
      if (url.searchParams.get("scope") !== "local") revoked.add(claims.session_id);
      res.writeHead(204);
      return res.end();
    }
    return reply(res, 404, { msg: "not found" });
  }

  async function storage(req, res, url, body) {
    const route = decodeURIComponent(url.pathname.replace("/storage/v1", ""));
    const publicRead = route.match(/^\/object\/public\/([^/]+)\/(.+)$/);
    if (publicRead) {
      const [, bucket, name] = publicRead;
      const { rows } = await pool.query("select public from storage.buckets where id = $1", [bucket]);
      const blob = blobs.get(`${bucket}/${name}`);
      if (!rows[0]?.public || !blob) return storageError(res, 400, "404", "not_found");
      res.writeHead(200, { "content-type": blob.mimetype });
      return res.end(blob.bytes);
    }
    const claims = claimsOf(req);
    if (!claims) return storageError(res, 400, "403", "invalid JWT");
    const remove = route.match(/^\/object\/([^/]+)$/);
    if (remove && req.method === "DELETE") {
      const { prefixes } = JSON.parse(body.toString());
      const rows = await asRole(claims, async (c) => (await c.query("delete from storage.objects where bucket_id = $1 and name = any($2) returning name", [remove[1], prefixes])).rows);
      rows.forEach((r) => blobs.delete(`${remove[1]}/${r.name}`));
      return reply(res, 200, rows);
    }
    const object = route.match(/^\/object\/([^/]+)\/(.+)$/);
    if (!object) return storageError(res, 400, "404", "not_found");
    const [, bucket, name] = object;
    if (req.method === "POST") {
      const { rows: [limit] } = await pool.query("select file_size_limit, allowed_mime_types from storage.buckets where id = $1", [bucket]);
      if (!limit) return storageError(res, 400, "404", "Bucket not found");
      const mimetype = req.headers["content-type"]?.split(";")[0];
      if (limit.file_size_limit && body.length > Number(limit.file_size_limit)) return storageError(res, 400, "413", "Payload too large");
      if (limit.allowed_mime_types && !limit.allowed_mime_types.includes(mimetype)) return storageError(res, 400, "415", "invalid_mime_type");
      const upsert = req.headers["x-upsert"] === "true";
      try {
        await asRole(claims, (c) => c.query(
          `insert into storage.objects (bucket_id, name, owner_id, mimetype, size) values ($1, $2, $3, $4, $5)${upsert ? " on conflict (bucket_id, name) do update set size = excluded.size, mimetype = excluded.mimetype" : ""}`,
          [bucket, name, claims.sub ?? null, mimetype, body.length],
        ));
      } catch (error) {
        if (error.code === "23505") return storageError(res, 400, "409", "Duplicate");
        if (error.code === "42501") return storageError(res, 400, "403", "new row violates row-level security policy");
        throw error;
      }
      blobs.set(`${bucket}/${name}`, { bytes: body, mimetype });
      return reply(res, 200, { Id: randomUUID(), Key: `${bucket}/${name}` });
    }
    const rows = await asRole(claims, async (c) => (await c.query("select mimetype from storage.objects where bucket_id = $1 and name = $2", [bucket, name])).rows);
    const blob = blobs.get(`${bucket}/${name}`);
    if (!rows.length || !blob) {
      if (req.method === "HEAD") { res.writeHead(400); return res.end(); }
      return storageError(res, 400, "404", "not_found");
    }
    res.writeHead(200, { "content-type": blob.mimetype, "content-length": blob.bytes.length });
    return res.end(req.method === "HEAD" ? undefined : blob.bytes);
  }

  function proxyRest(req, res, url, body) {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const headers = { ...req.headers, host: `127.0.0.1:${ports.rest}`, authorization: `Bearer ${!token || token === PUBLISHABLE_KEY ? anonJwt : token}` };
    const upstream = http.request({ host: "127.0.0.1", port: ports.rest, method: req.method, path: url.pathname.replace("/rest/v1", "") + url.search, headers }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    upstream.on("error", (error) => reply(res, 502, { message: error.message }));
    upstream.end(body);
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${ports.gateway}`);
    try {
      const body = await readBody(req);
      if (url.pathname.startsWith("/__test/")) {
        const input = JSON.parse(body.toString() || "{}");
        if (url.pathname === "/__test/fail") { failures.push({ ...input, re: new RegExp(input.path) }); return reply(res, 200, {}); }
        if (url.pathname === "/__test/reset") { failures = []; log = []; return reply(res, 200, {}); }
        if (url.pathname === "/__test/log") return reply(res, 200, log);
        if (url.pathname === "/__test/objects") return reply(res, 200, (await pool.query("select bucket_id, name, size, mimetype from storage.objects order by created_at")).rows);
        if (url.pathname === "/__test/token") {
          const user = await findUser(input.email, input.fullName);
          return reply(res, 200, { id: user.id, token: issue(user).access_token });
        }
        return reply(res, 404, {});
      }
      log.push({ method: req.method, path: url.pathname, size: body.length });
      const failure = failures.find((f) => (!f.method || f.method === req.method) && f.re.test(url.pathname) && f.times > 0);
      if (failure) {
        failure.times--;
        return reply(res, failure.status, { statusCode: String(failure.status), error: "injected", message: "injected failure", msg: "injected failure" });
      }
      if (url.pathname.startsWith("/auth/v1")) return await auth(req, res, url, body);
      if (url.pathname.startsWith("/storage/v1")) return await storage(req, res, url, body);
      if (url.pathname.startsWith("/rest/v1")) return proxyRest(req, res, url, body);
      return reply(res, 404, { message: "not found" });
    } catch (error) {
      console.error("[gateway]", error);
      reply(res, 500, { statusCode: "500", message: error.message });
    }
  });
  return new Promise((resolve) => server.listen(ports.gateway, "127.0.0.1", () => resolve(server)));
}

/** Vercel 함수의 4.5MB 요청 본문 제한을 흉내 내는 프록시 */
function ingress() {
  const server = http.createServer((req, res) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => { size += c.length; if (size <= INGRESS_LIMIT) chunks.push(c); });
    req.on("end", () => {
      if (size > INGRESS_LIMIT) return reply(res, 413, { error: { code: "FUNCTION_PAYLOAD_TOO_LARGE" } });
      const upstream = http.request({ host: "127.0.0.1", port: ports.next, method: req.method, path: req.url, headers: req.headers }, (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      });
      upstream.on("error", (error) => reply(res, 502, { error: error.message }));
      upstream.end(Buffer.concat(chunks));
    });
  });
  return new Promise((resolve) => server.listen(ports.app, "127.0.0.1", () => resolve(server)));
}

async function waitFor(url) {
  for (let i = 0; i < 150; i++) {
    try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  throw new Error(`시작 실패: ${url}`);
}

export async function startStack() {
  const { pool, cleanup } = await startPostgres();
  await migrate(pool);
  startRest();
  await waitFor(`http://127.0.0.1:${ports.rest}/`);
  const servers = [await gateway(pool), await ingress()];
  const next = spawn(path.join(root, "node_modules/.bin/next"), ["start", "-p", String(ports.next)], {
    stdio: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "production",
      SUPABASE_URL: `http://127.0.0.1:${ports.gateway}`,
      SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
      SUPABASE_STORAGE_URL: `http://127.0.0.1:${ports.gateway}/storage/v1/object/public`,
      APP_URL: `http://localhost:${ports.app}`,
    },
  });
  children.push(next);
  await waitFor(`http://127.0.0.1:${ports.next}/api/bootstrap`);
  return async () => {
    servers.forEach((s) => s.close());
    children.forEach((c) => c.kill());
    await pool.end().catch(() => undefined);
    await new Promise((r) => setTimeout(r, 300));
    cleanup();
  };
}
