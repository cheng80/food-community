import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export const selectSizes = {
  sm: { box: "h-8", icon: 16 },
  md: { box: "h-10", icon: 20 },
  lg: { box: "h-12", icon: 20 },
} as const;

export interface SelectItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof selectSizes;
  selected?: boolean;
}

export function SelectItem({ size = "md", selected = false, disabled, className, children, ...props }: SelectItemProps) {
  const s = selectSizes[size];
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      className={cx(
        "flex w-full cursor-pointer items-center justify-between bg-background-default px-3 text-left hover:bg-background-subtle disabled:cursor-not-allowed disabled:hover:bg-background-default",
        s.box,
        className,
      )}
      {...props}
    >
      <span className={cx("body-lg", disabled ? "text-text-disabled" : "text-text-default")}>{children}</span>
      {selected && <Icon name="check" size={s.icon} className="text-icon-brand" />}
    </button>
  );
}
