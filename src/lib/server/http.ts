import "server-only";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (origin !== expected) throw new ApiError(403, "허용되지 않은 요청이에요.");
}

export async function api(run: () => Promise<unknown>, status = 200) {
  try {
    return Response.json(await run(), { status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const known = error instanceof ApiError;
    return Response.json({ error: known ? error.message : "요청을 처리하지 못했어요. 다시 시도해 주세요." }, {
      status: known ? error.status : 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}

export async function json(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "JSON 요청이 필요해요.");
  // 등록 본문에는 이미지 대신 업로드된 경로만 받습니다.
  const text = await request.text();
  if (text.length > 64_000) throw new ApiError(413, "입력 내용이 너무 커요.");
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new ApiError(400, "올바른 JSON을 입력해 주세요."); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new ApiError(400, "올바른 JSON을 입력해 주세요.");
  return body as Record<string, unknown>;
}
