import type { Metadata } from "next";
import { MeView } from "./me-view";

export const metadata: Metadata = { title: "마이 페이지" };

export default function MePage() {
  return <MeView />;
}
