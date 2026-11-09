"use client";
import { useEffect, useState } from "react";
import { actions, useAppState } from "@/lib/store";
import { Empty } from "@/components/ui/Empty";
import { PageLoading } from "./NotFound";

export function AppData({ children }: { children: React.ReactNode }) {
  const { loaded } = useAppState();
  const [error, setError] = useState("");
  const load = () => actions.refresh().then(() => setError(""), (error) => setError(error instanceof Error ? error.message : "불러오지 못했어요."));
  useEffect(() => { void actions.refresh().catch((error) => setError(error instanceof Error ? error.message : "불러오지 못했어요.")); }, []);
  const ready = loaded && !error;
  return (
    <>
      {error
        ? <main className="mx-auto flex min-h-dvh max-w-page items-center px-(--spacing-20)"><Empty title="잠시 후 다시 이용해 주세요" description={error} primaryLabel="다시 시도" onPrimary={load} /></main>
        : !loaded && <PageLoading />}
      {/* Next.js의 경로 검사가 초기 로딩 중에도 페이지를 볼 수 있게 한다. */}
      <div hidden={!ready} className={ready ? "contents" : undefined}>{children}</div>
    </>
  );
}
