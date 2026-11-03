"use client";

import { useRouter } from "next/navigation";
import { Empty } from "@/components/ui/Empty";
import { TopNavigation } from "@/components/ui/Navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useHydrated } from "@/lib/store";
import { useBack } from "./hooks";

/** 없는 글/사용자. 저장된 상태를 읽기 전(프리렌더)에는 로딩으로 표시 */
export function NotFound({ title, description }: { title: string; description: string }) {
  const router = useRouter();
  const back = useBack();
  const hydrated = useHydrated();
  return (
    <>
      <TopNavigation title="숨은맛집" onBack={back} moreIcon="home" moreLabel="홈" onMore={() => router.push("/")} />
      <main className="mx-auto flex w-full max-w-page flex-1 items-center justify-center px-(--spacing-20) py-(--spacing-32)">
        {hydrated ? (
          <Empty title={title} description={description} primaryLabel="맛집 올리기" onPrimary={() => router.push("/restaurants/new")} />
        ) : (
          <Spinner />
        )}
      </main>
    </>
  );
}

export function PageLoading() {
  return (
    <main className="flex flex-1 items-center justify-center py-(--spacing-32)">
      <Spinner />
    </main>
  );
}
