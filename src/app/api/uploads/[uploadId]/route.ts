import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { publicImage, requireUser, supabase } from "@/lib/server/supabase";
import { CHUNK_BYTES, detectImageType, EXTENSIONS, imageError, isImageBucket, isUuid, maxChunks } from "@/lib/validation";

type Db = Awaited<ReturnType<typeof supabase>>;

/** 최대 조각 수만큼 지운다. 없는 조각은 무시되고, 실패해도 사용자 작업은 막지 않는다. */
async function removeChunks(db: Db, userId: string, uploadId: string) {
  const paths = [0, 1, 2].map((index) => `${userId}/${uploadId}/${index}`);
  await db.storage.from("upload-chunk").remove(paths).catch(() => undefined);
}

/** 조각을 합쳐 형식과 크기를 검증하고 공개 버킷의 최종 경로로 옮긴다. 재시도해도 결과가 같다. */
export async function POST(request: Request, ctx: RouteContext<"/api/uploads/[uploadId]">) {
  return api(async () => {
    checkOrigin(request);
    const { uploadId } = await ctx.params;
    if (!isUuid(uploadId)) throw new ApiError(400, "업로드 정보가 올바르지 않아요.");
    const { db, user } = await requireUser();
    const { bucket, type, chunks } = await json(request);
    if (!isImageBucket(bucket) || typeof type !== "string" || !Number.isInteger(chunks) || (chunks as number) < 1 || (chunks as number) > maxChunks(bucket)) {
      await removeChunks(db, user.id, uploadId);
      throw new ApiError(400, "업로드 정보가 올바르지 않아요.");
    }
    const invalid = imageError(type, 1, bucket);
    if (invalid) {
      await removeChunks(db, user.id, uploadId);
      throw new ApiError(400, invalid);
    }

    const path = `${user.id}/${uploadId}.${EXTENSIONS[type]}`;
    const target = db.storage.from(bucket);
    const done = { path, url: publicImage(bucket, path) };
    if ((await target.exists(path)).data) {
      await removeChunks(db, user.id, uploadId);
      return done;
    }

    const parts = await Promise.all(Array.from({ length: chunks as number }, (_, index) => db.storage.from("upload-chunk").download(`${user.id}/${uploadId}/${index}`)));
    if (parts.some((part) => part.error || !part.data)) throw new ApiError(409, "업로드가 끝나지 않았어요. 사진을 다시 올려 주세요.");
    const buffers = await Promise.all(parts.map((part) => part.data!.arrayBuffer()));
    const sizeOk = buffers.every((buffer, index) => (index === buffers.length - 1 ? buffer.byteLength > 0 : buffer.byteLength === CHUNK_BYTES));
    const bytes = new Uint8Array(await new Blob(buffers).arrayBuffer());
    const rejected = !sizeOk ? "업로드 정보가 올바르지 않아요." : imageError(type, bytes.length, bucket) ?? (detectImageType(bytes) === type ? undefined : "이미지 파일 형식을 확인해 주세요.");
    if (rejected) {
      await removeChunks(db, user.id, uploadId);
      throw new ApiError(400, rejected);
    }

    const { error } = await target.upload(path, bytes, { contentType: type, upsert: false });
    // 동시에 들어온 완료 요청이 먼저 끝난 경우. 조각은 재시도를 위해 실패 시에만 남긴다.
    if (error && String((error as { statusCode?: string }).statusCode) !== "409") throw new ApiError(502, "사진을 올리지 못했어요.");
    await removeChunks(db, user.id, uploadId);
    return done;
  }, 201);
}

/** 업로드 중단 시 조각 정리 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/uploads/[uploadId]">) {
  return api(async () => {
    checkOrigin(request);
    const { uploadId } = await ctx.params;
    if (!isUuid(uploadId)) throw new ApiError(400, "업로드 정보가 올바르지 않아요.");
    const { db, user } = await requireUser();
    await removeChunks(db, user.id, uploadId);
    return { ok: true };
  });
}
