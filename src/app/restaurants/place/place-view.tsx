"use client";

import { useBack, useRequireLogin } from "@/components/app/hooks";
import { PageLoading } from "@/components/app/NotFound";
import { Empty } from "@/components/ui/Empty";
import { TopNavigation } from "@/components/ui/Navigation";
import { TextField } from "@/components/ui/TextField";

export function PlaceView() {
  const ready = useRequireLogin();
  const back = useBack("/restaurants/new");
  if (!ready) return <PageLoading />;
  return (
    <>
      <TopNavigation title="장소 등록" onBack={back} moreIcon="home" moreLabel="이전 화면" onMore={back} />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-(--spacing-24) px-(--spacing-20) py-(--spacing-8)">
        <TextField label="장소 검색" icon="search" size="lg" placeholder="장소 이름이나 주소로 검색" disabled />
        <div className="flex justify-center py-(--spacing-24)">
          <Empty title="장소 검색을 준비 중이에요" description="이 단계에서는 화면만 연결되어 있고 검색과 지도는 아직 동작하지 않아요" />
        </div>
      </main>
    </>
  );
}
