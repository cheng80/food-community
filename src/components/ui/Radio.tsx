import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  size?: "sm" | "md";
}

/** 같은 name으로 묶어 사용. 선택 상태는 네이티브 :checked */
export function Radio({ label, size = "md", disabled, className, ...props }: RadioProps) {
  return (
    <label className={cx("inline-flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <input type="radio" className="peer sr-only" disabled={disabled} {...props} />
      <span
        aria-hidden
        className={cx(
          "flex shrink-0 items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-shadow-brand",
          "[&>span]:hidden peer-checked:[&>span]:block",
          size === "sm" ? "size-4" : "size-5",
          disabled
            ? "bg-background-disabled peer-checked:bg-background-skeleton-strong"
            : "border border-border-default bg-background-default peer-checked:border-0 peer-checked:bg-background-brand",
        )}
      >
        <span className={cx("rounded-full bg-background-default", size === "sm" ? "size-2" : "size-2.5")} />
      </span>
      <span className={cx("body-md", disabled ? "text-text-disabled" : "text-text-default")}>{label}</span>
    </label>
  );
}
