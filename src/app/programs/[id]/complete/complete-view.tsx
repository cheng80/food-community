"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Icon } from "@/components/ui/Icon";
import { TopNavigation } from "@/components/ui/Navigation";
import { SampleNotice, SummaryRow } from "@/components/ui/Payment";
import { activeApplication, findProgram, formatPrice, usePaymentSample } from "@/lib/payment-sample";

/** design.pen 18 결제 완료 (샘플). 실제 결제 승인 화면이 아니다. */
export function CompleteView({ id }: { id: string }) {
  const router = useRouter();
  const apps = usePaymentSample();
  const program = findProgram(id);
  const application = program && activeApplication(apps, program.id);

  return (
    <>
      <TopNavigation title="결제 완료" onBack={() => router.push(`/programs/${id}`)} moreIcon="home" moreLabel="홈" onMore={() => router.push("/")} />
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-(--spacing-16) px-(--spacing-20) py-(--spacing-32)">
        {program && application ? (
          <>
            <div className="flex flex-col items-center gap-(--spacing-16)">
              <span className="flex size-16 items-center justify-center rounded-full bg-background-brand">
                <Icon name="check" size={32} className="text-icon-on-brand" />
              </span>
              <h2 role="status" className="heading-md text-text-default">샘플 결제가 완료됐어요</h2>
            </div>
            <SampleNotice>화면 흐름만 보여 주는 샘플이에요. 실제로 결제되거나 청구되지 않았어요.</SampleNotice>
            <dl className="flex flex-col gap-(--spacing-8)">
              <SummaryRow label="프로그램" value={program.title} />
              <SummaryRow label="일시" value={program.dateShort} />
              <SummaryRow label="장소" value={program.place} />
              <SummaryRow label="결제 수단" value={application.method} />
              <SummaryRow label="결제 금액" value={`${formatPrice(program.price)} (샘플)`} />
            </dl>
            <Button size="lg" className="w-full" onClick={() => router.push("/me?tab=payments")}>결제 내역 보기</Button>
          </>
        ) : (
          <div className="flex justify-center py-(--spacing-32)">
            <Empty title="완료된 샘플 결제가 없어요" description="프로그램 상세에서 샘플 결제를 먼저 진행해 주세요" primaryLabel="프로그램 보기" onPrimary={() => router.push(`/programs/${program?.id ?? "sushi-bento"}`)} />
          </div>
        )}
      </main>
    </>
  );
}
