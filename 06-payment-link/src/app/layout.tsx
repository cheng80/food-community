import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "요리교실 원데이클래스 · 숨은 맛집",
  description: "취미 요리 수업 1건, 1,000원. 페이앱 결제 링크와 QR로 참여하세요.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko" className="antialiased"><body>{children}</body></html>;
}
