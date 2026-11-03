import type { MetadataRoute } from "next";

// globals.css의 --color-brand-500, --color-background-default와 같은 값이다.
const BRAND_COLOR = "#ff5a1f";
const BACKGROUND_COLOR = "#ffffff";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "숨은 맛집",
    short_name: "숨은맛집",
    description: "서울 구로 주변 숨은 맛집 커뮤니티",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: BRAND_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
