import Link from "next/link";
import { Button } from "./Button";
import { Badge, type BadgeProps } from "./Feedback";
import { Icon, type IconName } from "./Icon";

/** design.pen program/banner · 문구는 이미지에 들어 있어 링크 이름으로만 읽힌다 (대체 텍스트 중복 없음) */
export function ProgramBanner({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="block w-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-background-brand md:rounded-xl">
      <picture>
        <source media="(min-width: 768px)" srcSet="/images/program/banner-2480x806.png" width={2480} height={806} />
        <img src="/images/program/banner-720x360.png" width={720} height={360} alt="" className="block h-auto w-full md:rounded-xl" />
      </picture>
    </Link>
  );
}

/** design.pen program/hero */
export function ProgramHero({ mobile, desktop, alt }: { mobile: string; desktop: string; alt: string }) {
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <img src={mobile} alt={alt} className="block aspect-[2/1] w-full object-cover md:aspect-[2480/806] md:rounded-xl" />
    </picture>
  );
}

/** design.pen payment/sample-notice */
export function SampleNotice({ children = "샘플 미리보기예요. 실제 결제와 환불은 일어나지 않아요." }: { children?: string }) {
  return (
    <p role="note" className="flex w-full items-center gap-(--spacing-8) rounded-lg bg-background-subtle p-(--spacing-12)">
      <Icon name="info" size={16} className="shrink-0 text-icon-secondary" />
      <span className="body-md text-text-secondary">{children}</span>
    </p>
  );
}

/** design.pen program/info-row */
export function ProgramInfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex w-full items-start gap-(--spacing-12)">
      <Icon name={icon} size={20} className="shrink-0 text-icon-brand" />
      <dt className="body-md w-12 shrink-0 text-text-secondary">{label}</dt>
      <dd className="label-lg min-w-0 flex-1 text-text-default">{value}</dd>
    </div>
  );
}

/** design.pen payment/summary-row */
export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-(--spacing-12)">
      <dt className="body-md shrink-0 text-text-secondary">{label}</dt>
      <dd className="label-lg min-w-0 text-right text-text-default">{value}</dd>
    </div>
  );
}

export type PaymentStatus = "paid" | "cancelled" | "refund_failed";

const statuses: Record<PaymentStatus, { label: string; variant: BadgeProps["variant"] }> = {
  paid: { label: "결제 완료(샘플)", variant: "success" },
  cancelled: { label: "취소 완료(샘플)", variant: "info" },
  refund_failed: { label: "환불 실패(샘플)", variant: "error" },
};

export interface PaymentHistoryItemProps {
  href: string;
  title: string;
  meta: string;
  amount: string;
  status: PaymentStatus;
  onCancel?: () => void;
}

/** design.pen payment/history-item/* */
export function PaymentHistoryItem({ href, title, meta, amount, status, onCancel }: PaymentHistoryItemProps) {
  const s = statuses[status];
  return (
    <article className="flex flex-col gap-(--spacing-12) border-b border-border-default py-(--spacing-16)">
      <div className="flex items-center justify-between gap-(--spacing-8)">
        <Link href={href} className="heading-sm min-w-0 flex-1 truncate text-text-default">{title}</Link>
        <Badge variant={s.variant} className="shrink-0">{s.label}</Badge>
      </div>
      <p className="label-md text-text-tertiary">{meta}</p>
      <div className="flex min-h-8 items-center justify-between gap-(--spacing-12)">
        <span className="label-lg text-text-default">{amount}</span>
        {onCancel && (
          <Button variant="secondary" size="sm" aria-label={`${title} 샘플 취소`} onClick={onCancel}>샘플 취소</Button>
        )}
      </div>
    </article>
  );
}
