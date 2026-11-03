import { useId, useState } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import { SelectItem, selectSizes } from "./SelectItem";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  size?: keyof typeof selectSizes;
  disabled?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "선택하세요",
  helperText,
  errorText,
  size = "md",
  disabled = false,
  defaultOpen = false,
  className,
}: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const s = selectSizes[size];
  const message = errorText ?? helperText;

  return (
    <div
      className={cx("flex w-full flex-col gap-[5px]", className)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <span id={`${id}-label`} className="label-lg text-text-default">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={message ? `${id}-message` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "flex cursor-pointer items-center justify-between rounded-md border px-3 disabled:cursor-not-allowed",
          s.box,
          disabled ? "bg-background-disabled" : "bg-background-default",
          errorText ? "border-border-error" : open ? "border-background-brand" : "border-border-default",
        )}
      >
        <span id={`${id}-value`} className={cx("body-lg", selected ? "text-text-default" : "text-text-placeholder")}>
          {selected?.label ?? placeholder}
        </span>
        <Icon name="chevron-down" size={s.icon} className="text-icon-secondary" />
      </button>
      {message && (
        <span id={`${id}-message`} className={cx("label-md", errorText ? "text-text-error" : "text-text-secondary")}>
          {message}
        </span>
      )}
      {open && (
        <div role="listbox" aria-labelledby={`${id}-label`} className="flex flex-col border border-border-default bg-background-default">
          {options.map((o) => (
            <SelectItem
              key={o.value}
              size={size}
              selected={o.value === current}
              disabled={o.disabled}
              onClick={() => {
                setInner(o.value);
                onChange?.(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </SelectItem>
          ))}
        </div>
      )}
    </div>
  );
}
