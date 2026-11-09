"use client";

import type { PaymentRequest } from "@portone/browser-sdk/v2";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage, useBusy } from "@/components/app/hooks";
import { PageLoading } from "@/components/app/NotFound";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Empty } from "@/components/ui/Empty";
import { TopNavigation } from "@/components/ui/Navigation";
import { BottomSheet } from "@/components/ui/Overlay";
import { ProgramMedia } from "@/components/ui/ProgramMedia";
import { request, RequestError, send } from "@/lib/api";
import { type Product, won } from "@/lib/products";
import { useAppState, useNow } from "@/lib/store";

export function ProgramView({ id }: { id: string }) {
  const router = useRouter();
  const { loggedIn, loaded } = useAppState();
  const now = useNow();
  const [product, setProduct] = useState<Product>();
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const { busy, run } = useBusy();
  const back = () => router.push("/");
  const login = () => router.push(`/login?next=${encodeURIComponent(`/programs/${id}`)}`);

  useEffect(() => {
    const controller = new AbortController();
    request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ product }) => setProduct(product))
      .catch((error) => { if (!controller.signal.aborted) setLoadError(errorMessage(error, "상품을 불러오지 못했어요.")); });
    return () => controller.abort();
  }, [id]);

  if (!product && !loadError) return <PageLoading />;
  if (!product) return (
    <>
      <TopNavigation title="프로그램" onBack={back} moreIcon="home" moreLabel="홈" onMore={back} />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center gap-(--spacing-16) px-(--spacing-20) py-(--spacing-32) text-center">
        <Empty title={loadError} description="홈에서 공개된 프로그램을 둘러보세요." />
        <Button onClick={back}>홈으로</Button>
      </main>
    </>
  );

  const closed = product.price <= 0 || Date.parse(product.event_at) <= now;
  const eventAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full", timeStyle: "short", timeZone: "Asia/Seoul",
  }).format(new Date(product.event_at));
  const close = () => { if (!busy) setOpen(false); };
  const pay = () => run(async () => {
    setError("");
    try {
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const order = await send<PaymentRequest>("/api/payments", "POST", { productId: id });
      const result = await requestPayment(order);
      if (!result) return; // 모바일은 redirectUrl로 돌아온다.
      if (result.code !== undefined) { setError("결제를 완료하지 않았어요. 결제창에서 다시 시도해 주세요."); return; }
      router.replace(`/programs/${id}/complete?paymentId=${encodeURIComponent(order.paymentId)}`);
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) login();
      else setError(error instanceof RequestError ? error.message : "결제창을 열지 못했어요.");
    }
  });

  return (
    <>
      <TopNavigation title="프로그램 상세" onBack={back} moreIcon="home" moreLabel="홈" onMore={back} className="sticky top-0 z-30" />
      <main className="mx-auto w-full max-w-page flex-1 pb-(--spacing-32) md:px-(--spacing-20)">
        {product.images.hero_mobile && (
          <ProgramMedia mobile={product.images.hero_mobile} desktop={product.images.hero_desktop} alt={`${product.name} 소개 이미지`} />
        )}
        <div className="flex flex-col gap-(--spacing-24) p-(--spacing-20)">
          <header className="flex flex-col gap-(--spacing-8)">
            <p className="label-lg text-text-brand">이웃과 함께하는 요리 수업 · 테스트 상품</p>
            <h1 className="heading-lg text-text-default">{product.name}</h1>
            <p className="body-md text-text-secondary">{product.description}</p>
          </header>
          <dl className="grid gap-(--spacing-8) body-md text-text-secondary">
            <div><dt className="inline label-lg">일정 </dt><dd className="inline">{eventAt}</dd></div>
            <div><dt className="inline label-lg">장소 </dt><dd className="inline">{product.address}</dd></div>
            <div><dt className="inline label-lg">최대 정원 </dt><dd className="inline">{product.capacity}명</dd></div>
            <div><dt className="inline label-lg">참가비 </dt><dd className="inline">{won(product.price)}</dd></div>
          </dl>
          <section className="flex flex-col gap-(--spacing-8)">
            <h2 className="heading-sm">취소 규정</h2>
            <p className="body-md text-text-secondary">{product.cancel_policy}</p>
            <h2 className="heading-sm">식당과의 금전 관계</h2>
            <p className="body-md text-text-secondary">{product.sponsor_disclosure}</p>
          </section>
          <Button size="lg" disabled={!loaded || closed} onClick={() => {
            if (!loggedIn) { login(); return; }
            setError(""); setAgreed(false); setOpen(true);
          }}>{closed ? "참여할 수 없어요" : "수업 참여하기"}</Button>
        </div>
      </main>
      <BottomSheet open={open} title="테스트 결제" onClose={close} className="sm:max-w-[480px]!">
        <div className="flex w-full flex-col gap-(--spacing-16)">
          <p className="body-md text-text-secondary">포트원 테스트 채널에서 카드 결제를 확인합니다. 실제 수업 신청으로 처리되지 않아요.</p>
          <p className="heading-sm">{product.name} · {won(product.price)}</p>
          <Checkbox label="테스트 결제임을 확인했어요" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          {error && <p role="alert" className="body-md text-text-error">{error}</p>}
          <Button size="lg" loading={busy} disabled={!agreed} onClick={pay}>카드 테스트 결제</Button>
        </div>
      </BottomSheet>
    </>
  );
}
