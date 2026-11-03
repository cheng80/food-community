import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { LoginView } from "./login-view";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginView />
    </Suspense>
  );
}
