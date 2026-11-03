import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { CompleteView } from "./complete-view";

export const metadata: Metadata = { title: "결제 완료 (샘플)" };

export default function CompletePage({ params }: PageProps<"/programs/[id]/complete">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <CompleteView id={id} />)}</Suspense>;
}
