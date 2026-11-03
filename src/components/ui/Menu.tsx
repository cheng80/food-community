import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const sizes = {
  sm: { box: "h-8", icon: 16 },
  md: { box: "h-10", icon: 20 },
  lg: { box: "h-12", icon: 20 },
} as const;

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  variant?: "default" | "destructive";
  size?: keyof typeof sizes;
}

export function MenuItem({ icon, variant = "default", size = "md", disabled, className, children, ...props }: MenuItemProps) {
  const destructive = variant === "destructive";
  const s = sizes[size];
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2 bg-background-default px-3 text-left disabled:cursor-not-allowed",
        s.box,
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={s.icon} className={destructive ? "text-icon-error" : "text-icon-secondary"} />
      <span className={cx("body-lg", disabled ? "text-text-disabled" : destructive ? "text-text-error" : "text-text-default")}>
        {children}
      </span>
    </button>
  );
}

export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="menu"
      className={cx("flex w-[180px] flex-col gap-2 rounded-lg border border-border-default bg-background-default p-3", className)}
    >
      {children}
    </div>
  );
}
