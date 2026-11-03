import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { RestaurantForm } from "../../restaurant-form";

export const metadata: Metadata = { title: "맛집 수정" };

export default function EditRestaurantPage({ params }: PageProps<"/restaurants/[id]/edit">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <RestaurantForm editId={id} />)}</Suspense>;
}
