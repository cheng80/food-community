import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { getPlace } from "@/lib/server/places";
import { currentUser, requireUser } from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";
import { placeInput, saveError } from "../input";

const notFound = () => new ApiError(404, "없는 글입니다.");

export async function GET(_: Request, ctx: RouteContext<"/api/restaurants/[id]">) {
  return api(async () => {
    const { id } = await ctx.params;
    if (!isUuid(id)) throw notFound();
    const { db } = await currentUser();
    const { data, error } = await getPlace(db, id);
    if (error) throw new ApiError(502, "글을 불러오지 못했어요.");
    if (!data) throw notFound();
    return data;
  });
}

/** 소유권을 확인한다. RLS와 RPC가 같은 규칙을 한 번 더 강제한다. */
async function ownedPlace(session: Awaited<ReturnType<typeof requireUser>>, id: string) {
  if (!isUuid(id)) throw notFound();
  const { data, error } = await getPlace(session.db, id);
  if (error) throw new ApiError(502, "글을 불러오지 못했어요.");
  if (!data) throw notFound();
  if (data.authorId !== session.user.id) throw new ApiError(403, "내가 쓴 글만 바꿀 수 있어요.");
  return data;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/restaurants/[id]">) {
  return api(async () => {
    checkOrigin(request);
    const { id } = await ctx.params;
    const session = await requireUser();
    await ownedPlace(session, id);
    const input = await placeInput(session, await json(request));
    const { data, error } = await session.db.rpc("save_place", { p_id: id, ...input }).single<{ removed_paths: string[] }>();
    if (error) throw saveError(error);
    // DB 커밋 후 교체된 파일만 지운다. 실패해도 글은 정상이며 파일만 남는다.
    if (data.removed_paths.length) await session.db.storage.from("place-image").remove(data.removed_paths).catch(() => undefined);
    return { id };
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/restaurants/[id]">) {
  return api(async () => {
    checkOrigin(request);
    const { id } = await ctx.params;
    const session = await requireUser();
    await ownedPlace(session, id);
    // 소프트 삭제이므로 이미지 행과 파일은 보존한다.
    const { data, error } = await session.db.rpc("soft_delete_place", { p_id: id });
    if (error) throw new ApiError(502, "글을 삭제하지 못했어요.");
    if (!data) throw notFound();
    return { ok: true };
  });
}
