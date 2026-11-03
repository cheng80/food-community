import { useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface FileUploaderProps {
  label?: string;
  helperText?: string;
  dropzoneText?: string;
  errorText?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles?: (files: File[]) => void;
  /** 업로드된 FileItem 목록 */
  children?: ReactNode;
  className?: string;
}

export function FileUploader({
  label = "사진 * 0/5",
  helperText = "JPG, PNG · 10MB 이하",
  dropzoneText = "사진을 올려 주세요",
  errorText,
  accept = "image/jpeg,image/png",
  multiple = true,
  disabled = false,
  onFiles,
  children,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const emit = (list: FileList | null) => list && list.length > 0 && onFiles?.(Array.from(list));

  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <span className="label-lg text-text-default">{label}</span>
      <span className="label-md text-text-secondary">{helperText}</span>
      <div
        data-testid="dropzone"
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragover(false);
          if (!disabled) emit(e.dataTransfer.files);
        }}
        className={cx(
          "flex h-[88px] flex-col items-center justify-center gap-2 rounded-lg border",
          disabled ? "bg-background-disabled" : "bg-background-default",
          errorText ? "border-border-error" : dragover ? "border-background-brand" : "border-border-default",
        )}
      >
        <span className="body-md text-text-default">{dropzoneText}</span>
        <Button variant="secondary" size="sm" icon="plus" disabled={disabled} onClick={() => inputRef.current?.click()}>
          파일 선택
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-label={label}
          className="sr-only"
          onChange={(e) => {
            emit(e.target.files);
            e.target.value = ""; // 실패한 같은 파일을 다시 고를 수 있게
          }}
        />
      </div>
      {errorText && <span className="label-md text-text-error">{errorText}</span>}
      {children}
    </div>
  );
}

const statusIcon = {
  error: <Icon name="error" size={20} label="업로드 실패" className="text-icon-error" />,
  uploading: <Icon name="refresh" size={20} label="업로드 중" className="animate-spin text-icon-brand" />,
  complete: <Icon name="check" size={20} label="업로드 완료" className="text-icon-brand" />,
};

export interface FileItemProps {
  name: string;
  status: keyof typeof statusIcon;
  thumbnailUrl?: string;
  onRemove?: () => void;
}

export function FileItem({ name, status, thumbnailUrl, onRemove }: FileItemProps) {
  return (
    <div className="flex h-12 items-center gap-2">
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 로컬 미리보기(blob URL)
        <img src={thumbnailUrl} alt="" className="size-9 rounded object-cover" />
      ) : (
        <span className="size-9 rounded bg-background-skeleton" />
      )}
      <span className="body-md min-w-0 flex-1 truncate text-text-default">{name}</span>
      {statusIcon[status]}
      <button
        type="button"
        aria-label={`${name} 삭제`}
        onClick={onRemove}
        className="flex size-11 cursor-pointer items-center justify-center"
      >
        <Icon name="close" size={16} className="text-icon-secondary" />
      </button>
    </div>
  );
}
