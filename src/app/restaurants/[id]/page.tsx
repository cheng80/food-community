import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { DetailView } from "./detail-view";

export const metadata: Metadata = { title: "맛집 상세" };

export default function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <DetailView id={id} />)}</Suspense>;
}
