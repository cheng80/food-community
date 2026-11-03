import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { isImageBucket, ownsImage } from "@/lib/validation";

/** 아직 저장하지 않은 임시 이미지를 지운다. 글이나 프로필이 쓰는 이미지는 지우지 않는다. */
export async function DELETE(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const { db, user } = await requireUser();
    const { bucket, path } = await json(request);
    if (!isImageBucket(bucket) || !ownsImage(path, user.id)) throw new ApiError(400, "내 이미지만 지울 수 있어요.");
    const [profile, place] = await Promise.all([
      db.from("profile").select("user_id", { count: "exact", head: true }).eq("image_path", path),
      db.from("place_image").select("id", { count: "exact", head: true }).eq("image_path", path),
    ]);
    if (profile.error || place.error) throw new ApiError(502, "이미지를 지우지 못했어요.");
    if (profile.count || place.count) throw new ApiError(409, "사용 중인 이미지는 지울 수 없어요.");
    const { error } = await db.storage.from(bucket).remove([path]);
    if (error) throw new ApiError(502, "이미지를 지우지 못했어요.");
    return { ok: true };
  });
}
