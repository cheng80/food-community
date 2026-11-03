import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: "sm" | "md";
}

export function Chip({ selected = false, size = "md", disabled, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cx(
        "label-lg inline-flex cursor-pointer items-center gap-1 rounded-full disabled:cursor-not-allowed",
        size === "sm" ? "h-6 px-1.5" : "h-8 px-2",
        disabled
          ? "bg-background-skeleton text-text-disabled"
          : selected
            ? "bg-background-brand text-text-on-brand"
            : "border border-border-default bg-background-default text-text-default",
        className,
      )}
      {...props}
    >
      <Icon name="check" size={16} className={selected ? "text-icon-on-brand" : "text-icon-secondary"} />
      {children}
    </button>
  );
}
