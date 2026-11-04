"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { price, product } from "@/lib/product";
import { Button } from "./Button";

export function openPayment() {
  window.open(product.paymentUrl, "_blank", "popup,width=476,height=720,noopener,noreferrer");
}

export function PaymentLink() {
  const [showQR, setShowQR] = useState(false);
  const qrId = useId();

  return (
    <div className="flex flex-col gap-(--spacing-12)">
      <Button size="lg" className="bg-brand-700!" onClick={openPayment}>{price} 결제하기 (새 창)</Button>
      <Button variant="secondary" size="lg" aria-expanded={showQR} aria-controls={qrId} onClick={() => setShowQR(!showQR)}>
        {showQR ? "QR 닫기" : "QR결제하기"}
      </Button>
      <div id={qrId} hidden={!showQR} className="rounded-lg border border-border-default p-(--spacing-20) text-center">
        <Image src={product.qrImage} alt={`${product.title} ${price} 페이앱 결제 QR 코드`} width={125} height={125} unoptimized className="mx-auto h-48 w-48 [image-rendering:pixelated]" />
        <p className="body-md mt-(--spacing-12) text-text-secondary">휴대폰 카메라로 QR 코드를 비춰 주세요.</p>
      </div>
      <p className="body-md text-text-secondary">결제창이 보이지 않으면 아래 링크를 눌러 주세요.</p>
      <a href={product.paymentUrl} target="_blank" rel="noopener noreferrer" className="label-lg flex min-h-12 items-center justify-center rounded-lg text-text-default underline underline-offset-4">
        결제창 직접 열기 (새 창)
      </a>
    </div>
  );
}
