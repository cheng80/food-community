import { useId, useState, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  errorText?: string;
  maxLength?: number;
  /** 기본값 `{length}/{maxLength}` */
  counterText?: (length: number) => string;
}

export function Textarea({
  label,
  helperText,
  errorText,
  maxLength = 500,
  counterText = (length) => `${length}/${maxLength}`,
  disabled,
  className,
  id,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [innerLength, setLength] = useState(String(defaultValue ?? "").length);
  const length = props.value !== undefined ? String(props.value).length : innerLength;
  const message = errorText ?? helperText;
  return (
    <div className={cx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="label-lg text-text-default">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={3}
        disabled={disabled}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={`${inputId}-message`}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        className={cx(
          "body-lg h-[78px] resize-none rounded-md border p-3 text-text-default outline-none placeholder:text-text-placeholder",
          disabled ? "bg-background-disabled" : "bg-background-default",
          errorText ? "border-border-error" : "border-border-default focus:border-background-brand",
        )}
        {...props}
      />
      <div id={`${inputId}-message`} className={cx("flex justify-between", errorText && "flex-col gap-(--spacing-8)")}>
        <span className={cx("label-md", errorText ? "text-text-error" : "text-text-secondary")}>{message}</span>
        <span className="label-md text-text-secondary">{counterText(length)}</span>
      </div>
    </div>
  );
}
