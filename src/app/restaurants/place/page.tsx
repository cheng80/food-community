import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { PlaceView } from "./place-view";

export const metadata: Metadata = { title: "장소 등록" };

export default function PlacePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PlaceView />
    </Suspense>
  );
}
