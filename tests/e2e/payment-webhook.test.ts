import { createHmac, randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { APP_URL, Browser, testApi, tokenFor } from "./client";

it("완료 화면 없이 승인 웹훅만으로 승인과 스냅샷을 한 번 저장한다", async () => {
  const browser = new Browser();
  const email = "day66-webhook@example.test";
  await browser.login(email);
  const { id: userId } = await tokenFor(email);
  const productId = randomUUID();
  const name = "승인 웹훅 검증 수업";
  const amount = 35000;
  await testApi("query", {
    sql: `insert into public.product (id, name, description, event_at, address, capacity, price, publication_status, cancel_policy, sponsor_disclosure)
      values ($1, $2, '', now() + interval '1 day', '서울', 10, $3, 'PUBLIC', '', '')`,
    params: [productId, name, amount],
  });
  const checkout = await browser.send("/api/payments", "POST", { productId });
  expect(checkout.status).toBe(201);
  const order = await checkout.json();
  expect(order.customData).toEqual({ productId, userId });
  const { paymentId, storeId, channelKey } = order;
  const transactionId = randomUUID();
  const paidAt = new Date().toISOString();
  const provider = {
    status: "PAID", id: paymentId, storeId, transactionId, currency: "KRW", paidAt, orderName: name,
    amount: { total: amount }, channel: { key: channelKey, type: "TEST" },
    method: { type: "PaymentMethodCard" }, customData: JSON.stringify(order.customData),
  };
  const ledger = () => testApi("query", {
    sql: `select id, status, amount, transaction_key, payment_snapshot_id from public.payment where transaction_key = $1 order by amount desc`,
    params: [paymentId],
  });
  const snapshots = () => testApi("query", {
    sql: `select id, payment_snapshot, product_snapshot from public.payment_snapshot where product_snapshot ->> 'id' = $1 order by id`,
    params: [productId],
  });
  const secret = Buffer.from(process.env.PORTONE_WEBHOOK_SECRET!.slice("whsec_".length), "base64");
  const sendWebhook = (messageId: string, type = "Transaction.Paid", tamper = false, tx = transactionId) => {
    const raw = JSON.stringify({ type, timestamp: paidAt, data: { paymentId, storeId, transactionId: tx } }, null, 2);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", secret).update(`${messageId}.${timestamp}.${raw}`).digest("base64");
    return fetch(APP_URL + "/api/payments/webhook", {
      method: "POST", body: tamper ? raw + " " : raw,
      headers: { "content-type": "application/json", "webhook-id": messageId,
        "webhook-timestamp": timestamp, "webhook-signature": `v1,${signature}` },
    });
  };

  await testApi("portone", { ...provider, amount: { total: amount - 1 } });
  expect((await sendWebhook("tampered", "Transaction.Paid", true)).status).toBe(401);
  expect((await sendWebhook("cancel-pending", "Transaction.CancelPending")).status).toBe(200);
  expect((await sendWebhook("wrong-amount")).status).toBe(409);
  await testApi("portone", provider);
  expect((await sendWebhook("wrong-transaction", "Transaction.Paid", false, randomUUID())).status).toBe(409);
  expect(await ledger()).toEqual([]);
  expect(await snapshots()).toEqual([]);

  // No browser confirmation or redirect is used before the DB assertions.
  const messageId = "approval-first";
  const responses = await Promise.all([sendWebhook(messageId), sendWebhook(messageId), sendWebhook("approval-new-delivery")]);
  expect(responses.map(r => r.status)).toEqual([200, 200, 200]);
  const approved = await ledger();
  expect(approved).toEqual([expect.objectContaining({ status: "PAID", amount, transaction_key: paymentId })]);
  const frozen = await snapshots();
  expect(frozen).toEqual([{
    id: approved[0].payment_snapshot_id,
    payment_snapshot: expect.objectContaining({ provider: "PORTONE", environment: "TEST" }),
    product_snapshot: expect.objectContaining({ id: productId, name, price: amount }),
  }]);
  expect((await sendWebhook(messageId)).status).toBe(200);
  expect(await ledger()).toEqual(approved);
  expect(await snapshots()).toEqual(frozen);

  const confirmation = await browser.send("/api/payments/confirm", "POST", { paymentId, productId });
  expect(confirmation.status).toBe(200);
  expect(await confirmation.json()).toEqual({ name, amount, hasCancellation: false });
  expect(await ledger()).toEqual(approved);
  expect(await snapshots()).toEqual(frozen);

  await testApi("portone", { ...provider, status: "CANCELLED",
    cancellations: [{ id: "cancel-1", status: "SUCCEEDED", totalAmount: amount, cancelledAt: paidAt }] });
  expect((await sendWebhook("cancelled", "Transaction.Cancelled")).status).toBe(200);
  expect((await sendWebhook("late-paid")).status).toBe(200);
  expect((await sendWebhook("cancelled", "Transaction.Cancelled")).status).toBe(200);
  expect(await ledger()).toEqual([approved[0], expect.objectContaining({ status: "CANCELLED", amount: -amount })]);
  expect(await snapshots()).toHaveLength(2);
});
