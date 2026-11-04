import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PaymentLink } from "@/components/ui/PaymentLink";
import { price, product } from "@/lib/product";

export default function Home() {
  return (
    <div className="mx-auto max-w-page">
      <header className="flex items-center justify-between gap-(--spacing-16) border-b border-border-default px-(--spacing-24) py-(--spacing-20)">
        <Link href="/" className="heading-md text-text-default">숨은 맛집<span className="text-text-brand">.</span></Link>
        <span className="label-md text-text-secondary">취미 요리 수업</span>
      </header>
      <main className="px-(--spacing-20) py-(--spacing-24) sm:px-(--spacing-32)">
        <a href="#payment" className="block overflow-hidden rounded-2xl">
          <picture>
            <source media="(min-width: 640px)" srcSet="/images/program/banner-2480x806.png" />
            <img src="/images/program/banner-720x360.png" width="720" height="360" alt="심심한 주말, 놓치지 아까운 기회. 요리 수업 알아보기" className="h-auto w-full" />
          </picture>
        </a>
        <div className="grid items-start gap-(--spacing-32) py-(--spacing-32) lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <section aria-labelledby="class-title" className="flex min-w-0 flex-col gap-(--spacing-20)">
            <p className="label-lg text-brand-700">ONE DAY CLASS</p>
            <h1 id="class-title" className="display-sm break-keep sm:display-lg">{product.title}</h1>
            <p className="body-lg break-keep text-text-secondary">먹는 즐거움에서 만드는 즐거움으로.<br />취미 요리 수업 한 번으로 새로운 주말을 시작해 보세요.</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-(--spacing-24) gap-y-(--spacing-16) border-y border-border-default py-(--spacing-24)">
              <dt className="body-md text-text-secondary">상품</dt><dd className="label-lg">취미 요리 수업 1건</dd>
              <dt className="body-md text-text-secondary">참가비</dt><dd className="label-lg">{price}</dd>
              <dt className="body-md text-text-secondary">결제</dt><dd className="label-lg">페이앱 · 카드 및 간편결제</dd>
            </dl>
            <div className="flex items-start gap-(--spacing-12) rounded-lg bg-background-subtle p-(--spacing-16)">
              <Icon name="info" size={20} className="shrink-0 text-icon-secondary" />
              <p className="body-md break-keep text-text-secondary">결제 링크 연동 실습 페이지입니다. 결제를 진행하면 실제로 {price}이 청구됩니다. 수업 일정·장소와 취소·환불 조건은 판매자에게 먼저 확인해 주세요.</p>
            </div>
          </section>
          <section id="payment" aria-labelledby="payment-title" className="scroll-mt-8 rounded-2xl border border-border-default p-(--spacing-24)">
            <h2 id="payment-title" className="heading-md">수업 참여하기</h2>
            <p className="body-md mt-(--spacing-8) text-text-secondary">취미 요리 수업 1건</p>
            <p className="display-md my-(--spacing-24)">{price}<span className="body-md ml-(--spacing-8) text-text-secondary">/ 1건</span></p>
            <PaymentLink />
            <p className="label-md mt-(--spacing-16) break-keep text-text-secondary">결제와 결제 결과는 페이앱 창에서 확인해 주세요.</p>
          </section>
        </div>
      </main>
      <footer className="body-md border-t border-border-default px-(--spacing-24) py-(--spacing-20) text-text-secondary">숨은 맛집 · 결제 링크 연동 실습</footer>
    </div>
  );
}
