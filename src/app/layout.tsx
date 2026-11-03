import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AppData } from "@/components/app/AppData";

// Google 로그인 버튼 전용 (브랜드 가이드 Roboto Medium)
const roboto = Roboto({ weight: "500", subsets: ["latin"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: { default: "숨은 맛집", template: "%s · 숨은 맛집" },
  description: "서울 구로 주변 숨은 맛집 커뮤니티",
  applicationName: "숨은 맛집",
  appleWebApp: { capable: true, title: "숨은맛집", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5a1f", // globals.css --color-brand-500
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><AppData>{children}</AppData></body>
    </html>
  );
}
