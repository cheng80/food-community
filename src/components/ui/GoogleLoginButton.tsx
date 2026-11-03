import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import googleLogo from "../../../images/google-g-logo.png";

/** Google 브랜드 가이드 Sign in 버튼 (Light, Rectangular) */
export function GoogleLoginButton({
  className,
  children = "Google 계정으로 로그인",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded border border-google-border bg-google-surface px-3",
        "font-google text-(length:--font-size-200) leading-5 font-medium text-google-text",
        className,
      )}
      {...props}
    >
      <Image src={googleLogo} alt="" width={20} height={20} />
      {children}
    </button>
  );
}
