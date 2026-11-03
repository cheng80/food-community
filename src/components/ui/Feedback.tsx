import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const skeletonShapes = {
  text: "h-5 w-[170px] rounded",
  rectangle: "h-[90px] w-[180px] rounded-lg",
  circle: "size-12 rounded-full",
};

export interface SkeletonProps {
  shape?: keyof typeof skeletonShapes;
  className?: string;
}

/** 크기는 className(w-*, h-*)으로 덮어쓰기 */
export function Skeleton({ shape = "text", className }: SkeletonProps) {
  return <span aria-hidden className={cx("block animate-pulse bg-background-skeleton", skeletonShapes[shape], className)} />;
}

const toastVariants: Record<string, { bg: string; icon: IconName }> = {
  success: { bg: "bg-background-success", icon: "check" },
  error: { bg: "bg-background-error", icon: "error" },
  info: { bg: "bg-background-info", icon: "info" },
  warning: { bg: "bg-background-warning", icon: "warning" },
};

export interface ToastProps {
  variant?: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Toast({ variant = "success", message, onClose, className }: ToastProps) {
  const v = toastVariants[variant];
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cx("flex min-h-12 w-full items-center gap-3 px-4", v.bg, className)}
    >
      <Icon name={v.icon} size={20} className="text-icon-on-brand" />
      <span className="body-md flex-1 whitespace-pre-line text-text-inverse">{message}</span>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
      >
        <Icon name="close" size={20} className="text-icon-on-brand" />
      </button>
    </div>
  );
}

const badgeVariants = {
  neutral: "bg-background-inverse",
  success: "bg-background-success",
  error: "bg-background-error",
  info: "bg-background-info",
  warning: "bg-background-warning",
};

export interface BadgeProps {
  variant?: keyof typeof badgeVariants;
  size?: "md" | "lg";
  children: string;
  className?: string;
}

export function Badge({ variant = "neutral", size = "md", children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "label-md inline-flex items-center justify-center rounded px-2 text-text-inverse",
        size === "md" ? "h-5" : "h-6",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
