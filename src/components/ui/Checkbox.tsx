import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  size?: "sm" | "md";
  indeterminate?: boolean;
  error?: boolean;
}

export function Checkbox({
  label,
  size = "md",
  indeterminate = false,
  error = false,
  disabled,
  checked,
  defaultChecked = false,
  onChange,
  className,
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultChecked);
  const isChecked = checked ?? inner;
  const filled = isChecked || indeterminate;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={cx("inline-flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={isChecked}
        disabled={disabled}
        aria-invalid={error || undefined}
        onChange={(e) => {
          setInner(e.target.checked);
          onChange?.(e);
        }}
        {...props}
      />
      <span
        aria-hidden
        className={cx(
          "label-lg flex shrink-0 items-center justify-center rounded-[3px] text-text-on-brand peer-focus-visible:ring-2 peer-focus-visible:ring-shadow-brand",
          size === "sm" ? "size-4" : "size-5",
          disabled
            ? filled
              ? "bg-background-skeleton-strong"
              : "bg-background-disabled"
            : cx(
                filled ? "bg-background-brand" : "border bg-background-default",
                error ? "border border-border-error" : !filled && "border-border-default",
              ),
        )}
      >
        {indeterminate ? "−" : isChecked && "✓"}
      </span>
      <span className={cx("body-md", disabled ? "text-text-disabled" : "text-text-default")}>{label}</span>
    </label>
  );
}
