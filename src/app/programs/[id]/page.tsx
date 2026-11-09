import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { ProgramView } from "./program-view";

export const metadata = { title: "프로그램" };

export default function ProgramPage({ params }: PageProps<"/programs/[id]">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <ProgramView key={id} id={id} />)}</Suspense>;
}
