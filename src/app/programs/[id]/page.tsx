import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { ProgramView } from "./program-view";

export const metadata: Metadata = { title: "요리 수업 (샘플)" };

export default function ProgramPage({ params }: PageProps<"/programs/[id]">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <ProgramView id={id} />)}</Suspense>;
}
