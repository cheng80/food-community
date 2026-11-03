import "server-only";
import { ApiError } from "@/lib/server/http";
import type { requireUser } from "@/lib/server/supabase";
import { MAX_PHOTOS, ownsImage, restaurantErrors } from "@/lib/validation";

type Session = Awaited<ReturnType<typeof requireUser>>;

/** 쓰기 입력 검증: 글 규칙, 사진 1~5장, 본인 폴더의 실제 파일, 중복 없음 */
export async function placeInput({ db, user }: Session, body: Record<string, unknown>) {
  const message = Object.values(restaurantErrors(body)).find(Boolean);
  if (message) throw new ApiError(400, message);
  const paths = body.imagePaths;
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > MAX_PHOTOS || new Set(paths).size !== paths.length) throw new ApiError(400, `사진은 1장 이상 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
  if (!paths.every((path) => ownsImage(path, user.id))) throw new ApiError(400, "내가 올린 사진만 사용할 수 있어요.");
  const found = await Promise.all((paths as string[]).map((path) => db.storage.from("place-image").exists(path)));
  if (found.some((result) => !result.data)) throw new ApiError(400, "사진을 다시 올려 주세요.");
  return {
    p_title: (body.name as string).trim(),
    p_content: (body.content as string).trim(),
    p_address: (body.address as string).trim(),
    p_image_paths: paths as string[],
  };
}

/** 같은 경로를 다른 글이 쓰는 경우 unique 위반으로 RPC 전체가 롤백된다. */
export function saveError(error: { code?: string }) {
  if (error.code === "23505") return new ApiError(409, "이미 다른 글에서 쓰는 사진이에요.");
  if (error.code === "23514" || error.code === "22023") return new ApiError(400, "입력 내용을 확인해 주세요.");
  if (error.code === "P0002") return new ApiError(404, "없는 글입니다.");
  if (error.code === "42501") return new ApiError(403, "내가 쓴 글만 수정할 수 있어요.");
  return new ApiError(502, "글을 저장하지 못했어요. 다시 시도해 주세요.");
}
