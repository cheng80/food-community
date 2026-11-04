"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBack } from "@/components/app/hooks";
import { NotFound } from "@/components/app/NotFound";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { TopNavigation } from "@/components/ui/Navigation";
import { BottomSheet } from "@/components/ui/Overlay";
import { ProgramHero, ProgramInfoRow, SampleNotice, SummaryRow } from "@/components/ui/Payment";
import { Radio } from "@/components/ui/Radio";
import { activeApplication, currentCount, findProgram, formatPrice, sampleActions, usePaymentSample } from "@/lib/payment-sample";
import { useAppState } from "@/lib/store";

const METHODS = ["샘플 카드", "샘플 간편결제"];

/** design.pen 16 상세 · 17 결제하기 시트 · 24 데스크톱. 시트 상태는 URL(?sheet=payment)로 바로 열린다. */
export function ProgramView({ id }: { id: string }) {
  const router = useRouter();
  const back = useBack();
  const params = useSearchParams();
  const { loggedIn } = useAppState();
  const apps = usePaymentSample();
  const [method, setMethod] = useState(METHODS[0]);
  const [agreed, setAgreed] = useState(false);
  const program = findProgram(id);

  if (!program) return <NotFound title="없는 프로그램입니다" description="주소가 잘못되었거나 모집이 끝난 프로그램이에요" />;

  const self = `/programs/${program.id}`;
  const sheetUrl = `${self}?sheet=payment`;
  const count = currentCount(apps, program);
  const full = count >= program.capacity;
  const applied = activeApplication(apps, program.id);
  const sheetOpen = params.get("sheet") === "payment" && !full && !applied;
  const close = () => router.replace(self, { scroll: false });

  const openSheet = () => {
    if (!loggedIn) router.push(`/login?next=${encodeURIComponent(sheetUrl)}`);
    else router.push(sheetUrl, { scroll: false });
  };
  const pay = () => {
    if (sampleActions.pay(program.id, method)) router.push(`${self}/complete`);
  };

  return (
    <>
      <TopNavigation title="요리 수업" onBack={back} moreIcon="user" moreLabel="내 정보" onMore={() => router.push("/me")} className="sticky top-0 z-30" />
      <main className="mx-auto w-full max-w-page flex-1">
        <div className="md:px-(--spacing-20) md:pb-(--spacing-8)">
          <ProgramHero {...program.hero} />
        </div>
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-(--spacing-32) lg:px-(--spacing-20) lg:py-(--spacing-24)">
          <section className="flex flex-col gap-(--spacing-16) px-(--spacing-20) py-(--spacing-24) lg:p-0">
            <h2 className="heading-lg text-text-default">{program.title}</h2>
            <SampleNotice />
            <dl className="flex flex-col gap-(--spacing-12)">
              <ProgramInfoRow icon="calendar" label="일시" value={program.date} />
              <ProgramInfoRow icon="map-pin" label="장소" value={program.place} />
              <ProgramInfoRow icon="user" label="정원" value={`${count}명 신청 / 최대 ${program.capacity}명`} />
              <ProgramInfoRow icon="info" label="참가비" value={`${formatPrice(program.price)} (샘플 가격)`} />
            </dl>
            <p className="body-lg text-text-content">{program.description}</p>
          </section>
          <div className="h-2 bg-background-subtle lg:hidden" />
          <div>
            <section className="flex flex-col gap-(--spacing-8) px-(--spacing-20) py-(--spacing-24) lg:p-0 lg:pb-(--spacing-24)">
              <h2 className="heading-sm text-text-default">취소 규정 (샘플)</h2>
              <p className="body-md text-text-secondary">실제 환불 규정은 아직 정해지지 않았어요. 여기서는 행사 3일 전까지 취소할 수 있다고 가정해 보여 줘요.</p>
              <h2 className="heading-sm text-text-default">식당과의 금전 관계</h2>
              <p className="body-md text-text-secondary">{program.sponsor}</p>
            </section>
            <div className="sticky bottom-0 z-20 border-t border-border-default bg-background-default px-(--spacing-20) pt-(--spacing-12) pb-(--spacing-24) lg:static lg:border-0 lg:p-0">
              {applied ? (
                <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push("/me?tab=payments")}>이미 신청했어요 · 결제 내역 보기</Button>
              ) : (
                <Button size="lg" className="w-full" disabled={full} onClick={openSheet}>{full ? "정원이 찼어요" : "수업 참여하기"}</Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomSheet open={sheetOpen} title="결제하기" onClose={close} className="max-h-dvh max-w-full! overflow-y-auto outline-none sm:max-w-[480px]!">
        <form
          className="flex w-full flex-col gap-(--spacing-16)"
          onSubmit={(e) => {
            e.preventDefault();
            pay();
          }}
        >
          <SampleNotice />
          <dl className="flex flex-col gap-(--spacing-8)">
            <SummaryRow label="프로그램" value={program.title} />
            <SummaryRow label="현재 인원" value={`${count}명 / 최대 ${program.capacity}명`} />
            <SummaryRow label="참가비" value={`${formatPrice(program.price)} (샘플)`} />
          </dl>
          <fieldset className="flex flex-col gap-(--spacing-8)">
            <legend className="label-lg pb-(--spacing-8) text-text-default">결제 수단</legend>
            {METHODS.map((m) => (
              <Radio key={m} name="method" label={m} value={m} checked={method === m} onChange={() => setMethod(m)} />
            ))}
          </fieldset>
          <Checkbox label="취소 규정(샘플)을 확인했어요" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <div className="flex gap-(--spacing-8)">
            <Button variant="secondary" size="lg" className="flex-1" onClick={close}>닫기</Button>
            <Button type="submit" size="lg" className="flex-1" disabled={!agreed}>샘플 결제 진행</Button>
          </div>
        </form>
      </BottomSheet>
    </>
  );
}
