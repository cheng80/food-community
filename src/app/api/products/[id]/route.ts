import { api, ApiError } from "@/lib/server/http";
import { getProduct } from "@/lib/server/products";
import { currentUser } from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(404, "공개된 상품을 찾지 못했어요.");
    return { product: await getProduct((await currentUser()).db, id) };
  });
}
