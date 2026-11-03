import { useId, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const sizes = {
  sm: { box: "h-8", icon: 16 },
  md: { box: "h-10", icon: 20 },
  lg: { box: "h-12", icon: 20 },
} as const;

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  helperText?: string;
  errorText?: string;
  icon?: IconName;
  size?: keyof typeof sizes;
}

/** focused 상태는 :focus-within, error는 errorText 유무로 표현 */
export function TextField({ label, helperText, errorText, icon, size = "md", disabled, className, id, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const s = sizes[size];
  const message = errorText ?? helperText;
  return (
    <div className={cx("flex w-full flex-col gap-[5px]", className)}>
      <label htmlFor={inputId} className="label-lg text-text-default">
        {label}
      </label>
      <div
        className={cx(
          "flex items-center gap-2 rounded-md border px-3",
          s.box,
          disabled ? "bg-background-disabled" : "bg-background-default",
          errorText ? "border-border-error" : "border-border-default focus-within:border-background-brand",
        )}
      >
        {icon && <Icon name={icon} size={s.icon} className="text-icon-tertiary" />}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={message ? `${inputId}-message` : undefined}
          className="body-lg min-w-0 flex-1 bg-transparent text-text-default outline-none placeholder:text-text-placeholder disabled:text-text-disabled disabled:placeholder:text-text-disabled"
          {...props}
        />
      </div>
      {message && (
        <span id={`${inputId}-message`} className={cx("label-md", errorText ? "text-text-error" : "text-text-secondary")}>
          {message}
        </span>
      )}
    </div>
  );
}
