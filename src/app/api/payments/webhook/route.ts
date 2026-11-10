import { InvalidInputError, verify, WebhookVerificationError } from "@portone/server-sdk/webhook";
import { api, ApiError } from "@/lib/server/http";
import { paymentDb, portoneConfig, verifyPortoneCancellation } from "@/lib/server/portone";
import { isUuid } from "@/lib/validation";

export async function POST(request: Request) {
  return api(async () => {
    const secret = process.env.PORTONE_WEBHOOK_SECRET;
    if (!secret) throw new ApiError(503, "포트원 웹훅 설정이 아직 준비되지 않았어요.");
    const raw = await request.text();
    if (raw.length > 64_000) throw new ApiError(413, "웹훅 내용이 너무 커요.");
    let webhook;
    try {
      webhook = await verify(secret, raw, Object.fromEntries(request.headers));
    } catch (error) {
      if (error instanceof WebhookVerificationError) throw new ApiError(401, "웹훅 서명이 올바르지 않아요.");
      if (error instanceof SyntaxError) throw new ApiError(400, "웹훅 본문이 올바르지 않아요.");
      if (error instanceof InvalidInputError) throw new ApiError(503, "포트원 웹훅 설정이 올바르지 않아요.");
      throw error;
    }
    if (typeof webhook?.type !== "string") throw new ApiError(400, "웹훅 이벤트가 올바르지 않아요.");
    if (webhook.type !== "Transaction.Cancelled" && webhook.type !== "Transaction.PartialCancelled") return { ok: true };

    const { paymentId, storeId, transactionId, cancellationId } = webhook.data ?? {};
    if (typeof storeId !== "string" || typeof paymentId !== "string" || typeof transactionId !== "string" || !transactionId
      || (cancellationId !== undefined && (typeof cancellationId !== "string" || !cancellationId.trim()))) {
      throw new ApiError(400, "웹훅 거래 정보가 올바르지 않아요.");
    }
    const config = portoneConfig();
    if (storeId !== config.storeId || !isUuid(paymentId)) return { ok: true };

    const db = paymentDb(config);
    const { data: checkout, error, status } = await db.from("payment_checkout")
      .select("product_id,user_id,amount,product_snapshot").eq("id", paymentId).maybeSingle();
    if (error || status < 200 || status >= 300) throw new ApiError(502, "주문 정보를 조회하지 못했어요.");
    if (!checkout) return { ok: true };

    const { paidAt, cancellations } = await verifyPortoneCancellation(paymentId, transactionId, cancellationId, checkout, config);
    const saved = await db.rpc("record_portone_cancellations", {
      p_checkout_id: paymentId, p_paid_at: paidAt, p_cancellations: cancellations,
    });
    if (saved.error || saved.status < 200 || saved.status >= 300) throw new ApiError(502, "취소 기록을 저장하지 못했어요.");
    return { ok: true };
  });
}
