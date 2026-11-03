import { cx } from "@/lib/cx";
import { Icon, type IconSize } from "./Icon";

export interface SpinnerProps {
  size?: IconSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className, label = "불러오는 중" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Icon name="refresh" size={size} className={cx("animate-spin", className ?? "text-icon-brand")} />
    </span>
  );
}
