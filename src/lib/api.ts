export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store", credentials: "same-origin" });
  } catch {
    throw new RequestError(0, "네트워크 연결을 확인해 주세요.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new RequestError(response.status, body?.error || "요청을 처리하지 못했어요.");
  return body as T;
}

export function send<T>(url: string, method: string, body?: unknown, keepalive = false) {
  return request<T>(url, { method, keepalive, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
}
