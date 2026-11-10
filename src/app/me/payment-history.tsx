"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { request } from "@/lib/api";
import { won, type PaymentHistoryItem } from "@/lib/products";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul",
});

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request<{ payments: PaymentHistoryItem[] }>("/api/payments", { signal: controller.signal })
      .then(({ payments }) => { if (!controller.signal.aborted) setPayments(payments); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  return (
    <section id="payments" aria-labelledby="payment-history-title" className="flex flex-col gap-(--spacing-12) px-(--spacing-20) pt-(--spacing-24) pb-(--spacing-32) md:col-start-2">
      <h2 id="payment-history-title" className="heading-sm text-text-default">테스트 결제 내역</h2>
      {failed ? (
        <div>
          <p role="alert" className="body-md">결제 내역을 불러오지 못했어요.</p>
          <Button variant="secondary" size="sm" onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}>다시 불러오기</Button>
        </div>
      ) : !payments ? (
        <p role="status" className="body-md">결제 내역을 불러오고 있어요.</p>
      ) : payments.length === 0 ? (
        <p className="body-md text-text-secondary">아직 결제 내역이 없어요.</p>
      ) : (
        <ul className="divide-y divide-border-default">
          {payments.map(({ id, name, status, amount, occurredAt }) => (
            <li key={id} className="flex flex-wrap items-center justify-between gap-(--spacing-8) py-(--spacing-12)">
              <div>
                <p className="label-lg break-words">{name}</p>
                {occurredAt && <time className="body-sm text-text-secondary" dateTime={occurredAt}>{dateFormat.format(new Date(occurredAt))}</time>}
              </div>
              <p className="body-md">{status === "CANCELLED" ? "취소" : "승인"} · {won(amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
