import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { paymentDb, portoneConfig, verifyPortone } from "@/lib/server/portone";
import { requireUser } from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const { db, user } = await requireUser();
    const { paymentId, productId } = await json(request);
    if (!isUuid(paymentId) || !isUuid(productId)) throw new ApiError(400, "올바른 결제 번호가 필요해요.");
    const config = portoneConfig();
    const server = paymentDb(config);
    const { data: checkout, error } = await server.from("payment_checkout")
      .select("product_id,user_id,amount,product_snapshot").eq("id", paymentId)
      .eq("user_id", user.id).eq("product_id", productId).maybeSingle();
    if (error) throw new ApiError(502, "주문 정보를 조회하지 못했어요.");
    if (!checkout) throw new ApiError(404, "내 결제 요청을 찾지 못했어요.");

    const existing = await db.from("payment").select("id").eq("transaction_key", paymentId).eq("status", "PAID").maybeSingle();
    if (existing.error) throw new ApiError(502, "결제 이력을 조회하지 못했어요.");
    if (!existing.data) {
      const paidAt = await verifyPortone(paymentId, checkout, config);
      const { error: saveError } = await server.rpc("record_portone_payment", {
        p_checkout_id: paymentId, p_user_id: user.id, p_paid_at: paidAt,
      });
      if (saveError) throw new ApiError(502, "결제 기록을 저장하지 못했어요. 이 화면에서 다시 확인해 주세요.");
    }
    return { name: checkout.product_snapshot.name, amount: checkout.amount };
  });
}
