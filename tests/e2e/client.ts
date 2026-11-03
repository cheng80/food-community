export const APP_URL = process.env.APP_URL!;
export const GATEWAY_URL = process.env.GATEWAY_URL!;
export const PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY!;
// 테스트가 브라우저 코드를 위해 전역 fetch를 바꿔도 실제 요청을 보낼 수 있게 보관한다.
const realFetch = globalThis.fetch;

/** 브라우저처럼 쿠키를 저장하고 같은 출처 Origin을 보내는 클라이언트 */
export class Browser {
  cookies = new Map<string, string>();
  setCookies: string[] = [];

  async fetch(url: string, init: RequestInit & { origin?: string | null } = {}) {
    const { origin = APP_URL, ...rest } = init;
    const headers = new Headers(rest.headers);
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (origin && rest.method && rest.method !== "GET") headers.set("origin", origin);
    const response = await realFetch(url.startsWith("http") ? url : APP_URL + url, { ...rest, headers, redirect: "manual" });
    for (const line of response.headers.getSetCookie()) {
      this.setCookies.push(line);
      const [pair] = line.split(";");
      const at = pair.indexOf("=");
      const name = pair.slice(0, at);
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(line) || at === pair.length - 1) this.cookies.delete(name);
      else this.cookies.set(name, pair.slice(at + 1));
    }
    return response;
  }

  send(url: string, method: string, body?: unknown, init: { origin?: string | null } = {}) {
    return this.fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), ...init });
  }

  async bootstrap() {
    const response = await this.fetch("/api/bootstrap");
    return { status: response.status, body: await response.json() };
  }

  /** OAuth 시작부터 callback까지. 마지막 redirect Location을 돌려준다. */
  async login(email: string, next = "/", extra = "") {
    const start = await this.send("/api/auth/login", "POST", { next });
    const { url } = await start.json();
    const authorize = await this.fetch(`${url}&test_user=${encodeURIComponent(email)}${extra}`);
    const callback = await this.fetch(authorize.headers.get("location")!);
    return callback.headers.get("location")!;
  }

  sessionCookie() {
    return [...this.cookies.keys()].filter((name) => /^sb-.*-auth-token/.test(name) && !name.includes("code-verifier"));
  }
}

export const testApi = (name: string, body?: unknown) =>
  realFetch(`${GATEWAY_URL}/__test/${name}`, { method: "POST", body: JSON.stringify(body ?? {}) }).then((r) => r.json());

export const tokenFor = (email: string, fullName?: string): Promise<{ id: string; token: string }> => testApi("token", { email, fullName });

/** BFF를 거치지 않는 직접 Data API 호출 — RLS만으로 막히는지 확인 */
export function rest(path: string, token: string | null, init: RequestInit = {}) {
  return fetch(`${GATEWAY_URL}/rest/v1${path}`, {
    ...init,
    headers: { apikey: PUBLISHABLE_KEY, authorization: `Bearer ${token ?? PUBLISHABLE_KEY}`, "content-type": "application/json", ...init.headers },
  });
}

export function storage(path: string, token: string, body: Uint8Array, contentType: string) {
  return fetch(`${GATEWAY_URL}/storage/v1/object/${path}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": contentType }, body: body as BodyInit });
}
