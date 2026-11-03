import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  size?: "sm" | "md";
}

export function Switch({ label, size = "md", disabled, className, ...props }: SwitchProps) {
  const sm = size === "sm";
  return (
    <label className={cx("inline-flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" disabled={disabled} {...props} />
      <span
        aria-hidden
        className={cx(
          "flex shrink-0 items-center rounded-full bg-background-skeleton-strong p-0.5 peer-focus-visible:ring-2 peer-focus-visible:ring-shadow-brand peer-checked:justify-end",
          !disabled && "peer-checked:bg-background-brand",
          sm ? "h-4 w-8" : "h-5 w-10",
        )}
      >
        <span className={cx("rounded-full bg-background-default", sm ? "size-3" : "size-4")} />
      </span>
      <span className={cx("body-md", disabled ? "text-text-disabled" : "text-text-default")}>{label}</span>
    </label>
  );
}
