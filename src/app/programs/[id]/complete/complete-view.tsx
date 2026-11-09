"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage } from "@/components/app/hooks";
import { Button } from "@/components/ui/Button";
import { TopNavigation } from "@/components/ui/Navigation";
import { RequestError, send } from "@/lib/api";
import { won } from "@/lib/products";
import { useHydrated } from "@/lib/store";

type Receipt = { name: string; amount: number };

export function CompleteView({ productId, paymentId, cancelled }: {
  productId: string; paymentId?: string; cancelled: boolean;
}) {
  const router = useRouter();
  const loaded = useHydrated();
  const [receipt, setReceipt] = useState<Receipt>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const productUrl = `/programs/${encodeURIComponent(productId)}`;

  useEffect(() => {
    if (!loaded || !paymentId || cancelled) return;
    let active = true;
    send<Receipt>("/api/payments/confirm", "POST", { paymentId, productId })
      .then((result) => { if (active) setReceipt(result); })
      .catch((error) => {
        if (!active) return;
        if (error instanceof RequestError && error.status === 401) {
          const next = `${productUrl}/complete?paymentId=${encodeURIComponent(paymentId)}`;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
        } else setError(errorMessage(error, "결제를 확인하지 못했어요."));
      });
    return () => { active = false; };
  }, [loaded, paymentId, productId, cancelled, productUrl, retry, router]);

  const message = cancelled ? "결제를 완료하지 않았어요." : !paymentId ? "결제 번호를 확인해 주세요." : error;
  return (
    <>
      <TopNavigation title="결제 확인" onBack={() => router.replace(productUrl)} />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-(--spacing-16) p-(--spacing-20)">
        <h1 className="heading-lg">{receipt ? "테스트 결제가 완료됐어요" : message ? "결제를 확인하지 못했어요" : "결제를 확인하고 있어요"}</h1>
        {receipt && <p role="status" className="body-md">{receipt.name} · {won(receipt.amount)}</p>}
        {message && <p role="alert" className="body-md text-text-secondary">{message}</p>}
        {error && <Button onClick={() => { setError(""); setRetry((n) => n + 1); }}>결제 결과 다시 확인</Button>}
        <Button variant="secondary" onClick={() => router.replace(receipt ? "/" : productUrl)}>{receipt ? "홈으로" : "상품 상세로"}</Button>
      </main>
    </>
  );
}
