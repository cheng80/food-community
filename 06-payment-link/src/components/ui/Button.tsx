import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";

const variants = {
  primary: { box: "bg-background-brand", text: "text-text-on-brand", icon: "text-icon-on-brand", spinner: "text-text-on-brand" },
  secondary: {
    box: "border border-border-default bg-background-default",
    text: "text-text-default",
    icon: "text-icon-secondary",
    spinner: "text-icon-brand",
  },
  destructive: { box: "bg-background-error", text: "text-text-on-brand", icon: "text-icon-on-brand", spinner: "text-text-on-brand" },
};

const sizes = {
  sm: { box: "h-8", icon: 16 },
  md: { box: "h-10", icon: 20 },
  lg: { box: "h-12", icon: 20 },
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: IconName;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "label-lg inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4",
        s.box,
        disabled ? "cursor-not-allowed bg-background-skeleton text-text-disabled" : cx(v.box, v.text, loading && "cursor-wait"),
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={s.icon} className={v.spinner} />
      ) : (
        icon && <Icon name={icon} size={s.icon} className={disabled ? "text-icon-secondary" : v.icon} />
      )}
      {children}
    </button>
  );
}
