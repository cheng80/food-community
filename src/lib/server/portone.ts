import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./http";

export function portoneConfig() {
  const { PORTONE_STORE_ID: storeId, PORTONE_TEST_CHANNEL_KEY: channelKey, PORTONE_API_SECRET: secret,
    SUPABASE_URL: dbUrl, SUPABASE_PAYMENT_SERVER_KEY: dbKey, APP_URL: appUrl } = process.env;
  if (!storeId || !channelKey || !secret || !dbUrl || !dbKey || !appUrl) {
    throw new ApiError(503, "테스트 결제 설정이 아직 준비되지 않았어요.");
  }
  if (secret === storeId || secret === channelKey) {
    throw new ApiError(503, "상점 ID나 채널 키와 별개인 V2 API Secret을 설정해 주세요.");
  }
  return { storeId, channelKey, secret, dbUrl, dbKey, appUrl };
}

type Config = ReturnType<typeof portoneConfig>;
export const paymentDb = ({ dbUrl, dbKey }: Config) => createClient(dbUrl, dbKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function portone(path: string, secret: string, body?: object) {
  try {
    const response = await fetch(`https://api.portone.io/payments/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `PortOne ${secret}`, ...(body && { "Content-Type": "application/json" }) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(503, "포트원 인증에 실패했어요. 테스트 결제의 V2 API Secret을 확인해 주세요.");
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "포트원에 연결하지 못했어요. 다시 시도해 주세요.");
  }
}

export async function registerPortone(id: string, amount: number, config: Config) {
  const response = await portone(`${id}/pre-register`, config.secret, { storeId: config.storeId, totalAmount: amount, currency: "KRW" });
  if (!response.ok) throw new ApiError(502, "포트원에서 결제를 준비하지 못했어요.");
}

type Checkout = { amount: number; product_id: string; user_id: string; product_snapshot: { name: string } };
type PortonePayment = {
  status?: string; id?: string; storeId?: string; currency?: string; paidAt?: string; orderName?: string;
  amount?: { total?: number }; channel?: { key?: string; type?: string };
  method?: { type?: string; easyPayMethod?: { type?: string } }; customData?: string;
  transactionId?: string;
  cancellations?: { status?: string; id?: string; totalAmount?: number; cancelledAt?: string }[];
};

async function getPortonePayment(id: string, config: Config): Promise<PortonePayment> {
  const response = await portone(`${id}?storeId=${encodeURIComponent(config.storeId)}`, config.secret);
  if (response.status === 404) throw new ApiError(409, "아직 포트원 결제가 확인되지 않았어요.");
  if (!response.ok) throw new ApiError(502, "포트원 결제 상태를 조회하지 못했어요.");
  const payment = await response.json().catch(() => null);
  if (!payment || typeof payment !== "object" || Array.isArray(payment)) {
    throw new ApiError(502, "포트원 결제 응답을 읽지 못했어요.");
  }
  return payment;
}

function checkOrder(id: string, paid: PortonePayment, checkout: Checkout, config: Config) {
  let custom: { productId?: string; userId?: string } | null = null;
  try { custom = JSON.parse(paid.customData ?? "null"); } catch { /* 승인 데이터가 일치하지 않음 */ }
  const card = paid.method?.type === "PaymentMethodCard"
    || (paid.method?.type === "PaymentMethodEasyPay" && paid.method.easyPayMethod?.type === "PaymentMethodCard");
  if (paid.id !== id || paid.storeId !== config.storeId || paid.channel?.key !== config.channelKey
    || paid.channel.type !== "TEST" || paid.currency !== "KRW" || !card
    || paid.amount?.total !== checkout.amount || paid.orderName !== checkout.product_snapshot.name
    || custom?.productId !== checkout.product_id || custom?.userId !== checkout.user_id) {
    throw new ApiError(409, "결제 정보가 주문과 일치하지 않아요.");
  }
}

const isDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

export async function verifyPortone(id: string, checkout: Checkout, config: Config) {
  const paid = await getPortonePayment(id, config);
  if (paid.status !== "PAID" || !isDate(paid.paidAt)) {
    throw new ApiError(409, "완료된 결제가 아직 확인되지 않았어요.");
  }
  checkOrder(id, paid, checkout, config);
  return paid.paidAt;
}

export async function verifyPortoneCancellation(
  id: string, transactionId: string, cancellationId: string | undefined, checkout: Checkout, config: Config,
) {
  const payment = await getPortonePayment(id, config);
  checkOrder(id, payment, checkout, config);
  if (payment.transactionId !== transactionId) throw new ApiError(409, "포트원 거래 번호가 일치하지 않아요.");
  if (!["CANCELLED", "PARTIAL_CANCELLED"].includes(payment.status ?? "") || !Array.isArray(payment.cancellations)) {
    throw new ApiError(502, "포트원에서 확정 취소가 아직 확인되지 않았어요.");
  }
  const cancellations = payment.cancellations.filter((item) => item?.status === "SUCCEEDED").map((item) => {
    const { id, totalAmount, cancelledAt } = item;
    if (typeof id !== "string" || !id.trim() || typeof totalAmount !== "number" || !Number.isSafeInteger(totalAmount)
      || totalAmount <= 0 || totalAmount > checkout.amount || (cancelledAt != null && !isDate(cancelledAt))) {
      throw new ApiError(502, "포트원 취소 정보가 올바르지 않아요.");
    }
    return { id, amount: totalAmount, cancelled_at: cancelledAt ?? null };
  });
  const total = cancellations.reduce((sum, item) => sum + item.amount, 0);
  if (!total || new Set(cancellations.map((item) => item.id)).size !== cancellations.length
    || (payment.status === "CANCELLED" ? total !== checkout.amount : total >= checkout.amount)
    || (cancellationId && !cancellations.some((item) => item.id === cancellationId))) {
    throw new ApiError(502, "포트원 취소 내역이 아직 일치하지 않아요.");
  }
  return { cancellations, paidAt: isDate(payment.paidAt) ? payment.paidAt : null };
}
