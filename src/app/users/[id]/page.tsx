import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "프로필" };

export default function UserProfilePage({ params }: PageProps<"/users/[id]">) {
  return <Suspense fallback={<PageLoading />}>{params.then(({ id }) => <ProfileView id={id} />)}</Suspense>;
}
