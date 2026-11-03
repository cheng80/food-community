import { request, RequestError, send } from "./api";
import { CHUNK_BYTES, imageError, type ImageBucket } from "./validation";

const RETRIES = 3;

/** 네트워크 오류와 5xx만 재시도한다. 같은 조각과 완료 요청은 멱등이다. */
async function withRetry<T>(task: () => Promise<T>) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      const retriable = error instanceof RequestError && (error.status === 0 || error.status >= 500);
      if (!retriable || attempt === RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
}

// 업로드했지만 아직 글·프로필에 저장되지 않은 이미지. 폼은 숨겨져도 상태가 유지되므로 탭을 닫을 때 치운다.
// ponytail: 브라우저가 강제 종료되면 파일이 남는다. 쌓이면 place_image에 없는 객체를 지우는 정리 작업을 추가한다.
const drafts = new Map<string, ImageBucket>();

export function discardImage(bucket: ImageBucket, path: string) {
  drafts.delete(path);
  void send("/api/uploads", "DELETE", { bucket, path }, true).catch(() => undefined);
}

/** 저장에 성공한 경로는 더 이상 임시 이미지가 아니다. */
export const commitDrafts = (paths: string[]) => paths.forEach((path) => drafts.delete(path));

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) drafts.forEach((bucket, path) => discardImage(bucket, path));
  });
}

/** 4MB 조각으로 BFF에 보낸 뒤 서버에서 합친다. 실패하면 올린 조각을 지우고 오류를 던진다. */
export async function uploadImage(file: File, bucket: ImageBucket) {
  const error = imageError(file.type, file.size, bucket);
  if (error) throw new Error(error);
  const uploadId = crypto.randomUUID();
  const chunks = Math.ceil(file.size / CHUNK_BYTES);
  try {
    for (let index = 0; index < chunks; index++) {
      const body = file.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES);
      await withRetry(() => request(`/api/uploads/${uploadId}/${index}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body }));
    }
    const result = await withRetry(() => send<{ path: string; url: string }>(`/api/uploads/${uploadId}`, "POST", { bucket, type: file.type, chunks }));
    drafts.set(result.path, bucket);
    return result;
  } catch (failure) {
    void request(`/api/uploads/${uploadId}`, { method: "DELETE" }).catch(() => undefined);
    throw failure;
  }
}
