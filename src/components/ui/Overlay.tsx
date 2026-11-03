import { useEffect, useId, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

function useEscape(open: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

export interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  actionIcon?: IconName;
  /** 확인 작업 진행 중 — 닫기와 중복 확인을 막음 */
  busy?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
}

export function Modal({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  actionIcon,
  busy = false,
  onConfirm,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const close = busy ? undefined : onClose;
  useEscape(open, close);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[280px] flex-col gap-(--spacing-16) rounded-xl bg-background-default p-(--spacing-16)"
      >
        <div className="flex justify-between">
          <h2 id={titleId} className="heading-sm text-text-default">
            {title}
          </h2>
          <button type="button" aria-label="닫기" disabled={busy} onClick={close} className="flex size-11 cursor-pointer items-center justify-center">
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className="body-md text-text-default">{description}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={actionIcon} disabled={busy} onClick={close} className="w-[120px]">
            {cancelLabel}
          </Button>
          <Button size="sm" icon={actionIcon} loading={busy} onClick={onConfirm} className="w-[120px]">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface BottomSheetProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function BottomSheet({ open, title, children, onClose, className }: BottomSheetProps) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "flex w-full max-w-[360px] flex-col items-center gap-(--spacing-16) rounded-t-xl bg-background-default p-(--spacing-20)",
          className,
        )}
      >
        <span aria-hidden className="h-1 w-8 rounded-sm bg-background-skeleton-strong" />
        <h2 className="heading-sm text-text-default">{title}</h2>
        {children}
      </div>
    </div>
  );
}
