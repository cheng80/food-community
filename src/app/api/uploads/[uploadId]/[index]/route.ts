import { api, ApiError, checkOrigin } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { CHUNK_BYTES, isUuid } from "@/lib/validation";

/** 조각 하나를 비공개 버킷에 저장한다. 같은 조각의 재전송은 덮어쓴다. */
export async function PUT(request: Request, ctx: RouteContext<"/api/uploads/[uploadId]/[index]">) {
  return api(async () => {
    checkOrigin(request);
    const { uploadId, index } = await ctx.params;
    if (!isUuid(uploadId) || !/^[0-2]$/.test(index)) throw new ApiError(400, "업로드 정보가 올바르지 않아요.");
    const { db, user } = await requireUser();
    if (Number(request.headers.get("content-length")) > CHUNK_BYTES) throw new ApiError(413, "조각이 너무 커요.");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length === 0) throw new ApiError(400, "업로드할 내용이 없어요.");
    if (bytes.length > CHUNK_BYTES) throw new ApiError(413, "조각이 너무 커요.");
    const { error } = await db.storage.from("upload-chunk").upload(`${user.id}/${uploadId}/${index}`, bytes, { contentType: "application/octet-stream", upsert: true });
    if (error) throw new ApiError(502, "사진을 올리지 못했어요.");
    return { ok: true };
  });
}
