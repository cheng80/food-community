import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { MeView } from "./me-view";

export const metadata: Metadata = { title: "마이 페이지" };

export default function MePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MeView />
    </Suspense>
  );
}
