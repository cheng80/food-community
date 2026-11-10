import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/payments/webhook/route";

const paymentId = "40000000-0000-4000-8000-000000000001";
const secret = Buffer.alloc(32, 7);
const storeId = "test-store";
const transactionId = "provider-transaction";
const checkout = { product_id: "p1", user_id: "u1", amount: 35000, product_snapshot: { name: "수업" } };
const paidAt = "2026-11-09T02:00:00Z";
const cancelledAt = "2026-11-09T03:00:00Z";
const event = {
  type: "Transaction.PartialCancelled",
  data: { paymentId, storeId, transactionId, cancellationId: "cancel-1" },
};
const provider = {
  id: paymentId, transactionId, storeId, status: "CANCELLED", currency: "KRW", orderName: "수업", paidAt,
  amount: { total: 35000 }, channel: { type: "TEST", key: "test-channel" },
  method: { type: "PaymentMethodCard" }, customData: '{"productId":"p1","userId":"u1"}',
  cancellations: [
    { id: "cancel-1", status: "SUCCEEDED", totalAmount: 10000, cancelledAt },
    { id: "cancel-2", status: "SUCCEEDED", totalAmount: 25000 },
    { id: "cancel-3", status: "FAILED", totalAmount: 35000 },
  ],
};

function signed(body: object = event, { age = 0, tamper = false } = {}) {
  const raw = JSON.stringify(body, null, 2);
  const timestamp = String(Math.floor(Date.now() / 1000) - age);
  const signature = createHmac("sha256", secret).update(`msg_1.${timestamp}.${raw}`).digest("base64");
  return new Request("https://app.test/api/payments/webhook", {
    method: "POST",
    body: tamper ? raw.trimEnd() + " " : raw,
    headers: { "content-type": "application/json", "webhook-id": "msg_1", "webhook-timestamp": timestamp, "webhook-signature": `v1,${signature}` },
  });
}

function mockServices(payment: object = provider, rpcStatus = 200) {
  const writes: unknown[] = [];
  const fetcher = vi.fn(async (input: URL | Request | string, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.href === `https://api.portone.io/payments/${paymentId}?storeId=${storeId}`) return Response.json(payment);
    if (url.pathname === "/rest/v1/payment_checkout" && url.searchParams.get("id") === `eq.${paymentId}`) {
      return Response.json([checkout]);
    }
    if (url.pathname === "/rest/v1/rpc/record_portone_cancellations") {
      writes.push(JSON.parse(String(init?.body)));
      return Response.json(null, { status: rpcStatus });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetcher);
  return { writes, fetcher };
}

beforeEach(() => {
  vi.stubEnv("PORTONE_WEBHOOK_SECRET", `whsec_${secret.toString("base64")}`);
  vi.stubEnv("PORTONE_STORE_ID", storeId);
  vi.stubEnv("PORTONE_TEST_CHANNEL_KEY", "test-channel");
  vi.stubEnv("PORTONE_API_SECRET", "test-secret");
  vi.stubEnv("SUPABASE_URL", "https://db.test");
  vi.stubEnv("SUPABASE_PAYMENT_SERVER_KEY", "server-key");
  vi.stubEnv("APP_URL", "https://app.test");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("포트원 취소 웹훅", () => {
  it.each([{ tamper: true }, { age: 301 }])("변조 또는 만료된 요청은 외부 조회 전에 거부한다: %j", async (options) => {
    const { fetcher } = mockServices();
    expect((await POST(signed(event, options))).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("취소 요청 상태와 다른 상점의 이벤트는 반영하지 않는다", async () => {
    const { fetcher } = mockServices();
    expect((await POST(signed({ ...event, type: "Transaction.CancelPending" }))).status).toBe(200);
    expect((await POST(signed({ ...event, data: { ...event.data, storeId: "other" } }))).status).toBe(200);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("뒤늦게 온 부분 취소 알림도 재조회한 확정 취소 두 건을 함께 기록한다", async () => {
    const { writes } = mockServices();
    expect((await POST(signed())).status).toBe(200);
    expect(writes).toEqual([{
      p_checkout_id: paymentId, p_paid_at: paidAt,
      p_cancellations: [
        { id: "cancel-1", amount: 10000, cancelled_at: cancelledAt },
        { id: "cancel-2", amount: 25000, cancelled_at: null },
      ],
    }]);
  });

  it("취소 번호를 생략한 전액 취소 알림도 단건 조회로 확인한다", async () => {
    const { writes } = mockServices();
    expect((await POST(signed({
      type: "Transaction.Cancelled", data: { paymentId, storeId, transactionId },
    }))).status).toBe(200);
    expect(writes).toHaveLength(1);
  });

  it("부분 취소 상태는 확정된 부분 금액만 기록한다", async () => {
    const { writes } = mockServices({ ...provider, status: "PARTIAL_CANCELLED", cancellations: [provider.cancellations[0]] });
    expect((await POST(signed())).status).toBe(200);
    expect(writes).toEqual([expect.objectContaining({
      p_cancellations: [{ id: "cancel-1", amount: 10000, cancelled_at: cancelledAt }],
    })]);
  });

  it.each([
    [{ channel: { ...provider.channel, type: "LIVE" } }, 409],
    [{ transactionId: "different-attempt" }, 409],
    [{ cancellations: [{ ...provider.cancellations[0], status: "REQUESTED" }] }, 502],
    [{ cancellations: [{ ...provider.cancellations[0], id: "other", totalAmount: 35000 }] }, 502],
    [{ cancellations: [{ ...provider.cancellations[0], totalAmount: 36000 }] }, 502],
  ])("주문과 불일치하거나 미확정인 취소는 저장하지 않는다: %j", async (change, status) => {
    const { writes } = mockServices({ ...provider, ...change });
    expect((await POST(signed())).status).toBe(status);
    expect(writes).toHaveLength(0);
  });

  it("저장에 실패하면 재전송을 위해 성공으로 응답하지 않는다", async () => {
    mockServices(provider, 500);
    expect((await POST(signed())).status).toBe(502);
  });
});
