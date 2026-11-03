import { nicknameError } from "@/lib/format";
import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { ownsImage } from "@/lib/validation";

export async function PATCH(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const { db, user } = await requireUser();
    const { nickname, imagePath } = await json(request);
    if (typeof nickname !== "string" || nicknameError(nickname)) throw new ApiError(400, "닉네임은 2~12자로 입력해 주세요.");
    if (imagePath !== undefined && !ownsImage(imagePath, user.id)) throw new ApiError(400, "내 프로필 이미지만 사용할 수 있어요.");

    const images = db.storage.from("profile-image");
    if (imagePath && !(await images.exists(imagePath)).data) throw new ApiError(400, "프로필 사진을 다시 올려 주세요.");
    const { data: before, error: readError } = await db.from("profile").select("image_path").eq("user_id", user.id).maybeSingle();
    if (readError) throw new ApiError(502, "프로필을 저장하지 못했어요.");

    const patch = { user_id: user.id, nickname: nickname.trim(), ...(imagePath ? { image_path: imagePath } : {}) };
    const { error } = await db.from("profile").upsert(patch, { onConflict: "user_id" });
    if (error) throw new ApiError(502, "프로필을 저장하지 못했어요.");

    // DB가 먼저 바뀐 뒤 이전 파일을 지운다. 실패해도 저장은 유효하다.
    if (imagePath && before?.image_path && before.image_path !== imagePath) await images.remove([before.image_path]).catch(() => undefined);
    return { ok: true };
  });
}
