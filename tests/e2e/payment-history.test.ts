import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { Browser, testApi, tokenFor } from "./client";

it("인증된 회원은 본인의 승인과 취소만 원승인 당시 상품명으로 조회한다", async () => {
  const owner = new Browser();
  const other = new Browser();
  const ownerEmail = "payment-owner@example.test";
  const otherEmail = "payment-other@example.test";
  await owner.login(ownerEmail, "/me");
  await other.login(otherEmail, "/me");
  const { id: ownerId } = await tokenFor(ownerEmail);
  const { id: otherId } = await tokenFor(otherEmail);
  const productId = randomUUID();
  const paymentId = randomUUID();
  const otherPaymentId = randomUUID();
  await testApi("query", {
    sql: `insert into public.product (id, name, description, event_at, address, capacity, price, cancel_policy, sponsor_disclosure)
      values ($1, '현재 상품명', '', now(), '서울', 10, 40000, '', '')`,
    params: [productId],
  });
  await testApi("query", {
    sql: `insert into public.payment_checkout (id, product_id, user_id, amount, product_snapshot)
      values ($1, $2, $3, 35000, '{"name":"주문 당시 상품명"}'), ($4, $2, $5, 35000, '{"name":"다른 회원 주문"}')`,
    params: [paymentId, productId, ownerId, otherPaymentId, otherId],
  });
  const paidAt = "2026-11-09T02:00:00Z";
  const cancelledAt = "2026-11-09T03:00:00Z";
  await testApi("query", {
    sql: "select public.record_portone_cancellations($1, $2, $3), public.record_portone_payment($4, $5, $2)",
    params: [paymentId, paidAt, JSON.stringify([{ id: "full", amount: 35000, cancelled_at: cancelledAt }]), otherPaymentId, otherId],
  });

  expect((await new Browser().fetch("/api/payments")).status).toBe(401);
  const response = await owner.fetch("/api/payments");
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const { payments } = await response.json();
  expect(payments).toEqual([
    { id: expect.any(String), status: "CANCELLED", name: "주문 당시 상품명", amount: -35000, occurredAt: expect.any(String) },
    { id: expect.any(String), status: "PAID", name: "주문 당시 상품명", amount: 35000, occurredAt: expect.any(String) },
  ]);
  expect(new Date(payments[0].occurredAt).toISOString()).toBe(new Date(cancelledAt).toISOString());
  expect(new Date(payments[1].occurredAt).toISOString()).toBe(new Date(paidAt).toISOString());
  const otherHistory = await other.fetch("/api/payments");
  expect((await otherHistory.json()).payments).toEqual([
    expect.objectContaining({ status: "PAID", name: "다른 회원 주문" }),
  ]);
});
