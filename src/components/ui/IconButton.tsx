import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName, type IconSize } from "./Icon";

const variants = {
  ghost: { box: "", icon: "text-icon-default" },
  "circle-brand": { box: "rounded-full bg-background-brand", icon: "text-icon-on-brand" },
  "circle-neutral": { box: "rounded-full bg-background-subtle", icon: "text-icon-default" },
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  variant?: keyof typeof variants;
  iconSize?: IconSize;
  /** 아이콘 색 덮어쓰기 (text-icon-*) */
  iconClassName?: string;
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  iconSize = 24,
  iconClassName,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  const v = variants[variant];
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        "flex size-12 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40",
        v.box,
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={iconSize} className={iconClassName ?? v.icon} />
    </button>
  );
}
