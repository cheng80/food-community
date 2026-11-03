"use client";

import { useBack, useRequireLogin } from "@/components/app/hooks";
import { NaverMap } from "@/components/app/NaverMap";
import { PageLoading } from "@/components/app/NotFound";
import { TopNavigation } from "@/components/ui/Navigation";
import { AddressBox } from "@/components/ui/Place";
import { TextField } from "@/components/ui/TextField";
import { DEFAULT_CENTER } from "@/lib/naver-map";

export function PlaceView() {
  const ready = useRequireLogin();
  const back = useBack("/restaurants/new");
  if (!ready) return <PageLoading />;
  return (
    <>
      <TopNavigation title="장소 등록" onBack={back} moreIcon="home" moreLabel="이전 화면" onMore={back} />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-(--spacing-12) px-(--spacing-20) py-(--spacing-8)">
        <TextField label="장소 검색" icon="search" size="lg" placeholder="장소 이름이나 주소로 검색" disabled helperText="검색은 다음 단계에서 연결돼요" />
        <NaverMap center={DEFAULT_CENTER} centerPin className="h-[380px] rounded-xl" />
        <AddressBox status="loading">주소 변환은 다음 단계에서 연결돼요</AddressBox>
      </main>
    </>
  );
}
