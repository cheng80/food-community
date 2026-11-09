import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPortone, verifyPortone } from "@/lib/server/portone";

const id = "40000000-0000-4000-8000-000000000001";
const config = { storeId: "test-store", channelKey: "test-channel", secret: "server-secret",
  dbUrl: "https://example.test", dbKey: "server-key", appUrl: "http://localhost:3000" };
const checkout = { amount: 35000, product_id: "p1", user_id: "u1", product_snapshot: { name: "수업" } };
const paidAt = "2026-11-09T02:00:00Z";
const paid = {
  id, storeId: config.storeId, status: "PAID", currency: "KRW", orderName: "수업", paidAt,
  amount: { total: 35000 }, channel: { type: "TEST", key: config.channelKey },
  method: { type: "PaymentMethodCard" }, customData: JSON.stringify({ productId: "p1", userId: "u1" }),
};

afterEach(() => vi.unstubAllGlobals());

describe("포트원 주문 검증", () => {
  it("서버 금액을 사전 등록하고 TEST 승인 응답만 인정한다", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(Response.json(paid));
    vi.stubGlobal("fetch", fetcher);
    await registerPortone(id, checkout.amount, config);
    expect(fetcher.mock.calls[0][0]).toBe(`https://api.portone.io/payments/${id}/pre-register`);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ storeId: config.storeId, totalAmount: 35000, currency: "KRW" });
    await expect(verifyPortone(id, checkout, config)).resolves.toBe(paidAt);
  });

  it("포트원 인증 오류를 앱 로그인 오류나 일반 결제 실패와 구분한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ type: "UNAUTHORIZED" }, { status: 401 })));
    await expect(registerPortone(id, checkout.amount, config)).rejects.toMatchObject({ status: 503 });
  });

  it("카드 기반 간편결제를 카드 승인으로 인정한다", async () => {
    const method = { type: "PaymentMethodEasyPay", easyPayMethod: paid.method };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...paid, method })));
    await expect(verifyPortone(id, checkout, config)).resolves.toBe(paidAt);
  });

  it.each([
    { status: "FAILED" }, { status: "CANCELLED" }, { amount: { total: 1000 } },
    { channel: { ...paid.channel, type: "LIVE" } }, { channel: { ...paid.channel, key: "other" } },
    { method: { type: "PaymentMethodEasyPay", easyPayMethod: { type: "PaymentMethodEasyPayMethodCharge" } } },
    { customData: '{"productId":"p1","userId":"other"}' }, { customData: "{}" }, { currency: "USD" },
  ])("주문과 불일치하는 승인 응답을 거부한다: %j", async (change) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...paid, ...change })));
    await expect(verifyPortone(id, checkout, config)).rejects.toMatchObject({ status: 409 });
  });
});
