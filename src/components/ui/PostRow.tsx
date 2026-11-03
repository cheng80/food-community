import Link from "next/link";
import { IconButton } from "./IconButton";

export interface PostRowProps {
  title: string;
  meta: string;
  href: string;
  thumbnailUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** design.pen 05 마이 페이지 · Post Row */
export function PostRow({ title, meta, href, thumbnailUrl, onEdit, onDelete }: PostRowProps) {
  return (
    <div className="flex items-center gap-(--spacing-12) border-b border-border-default py-(--spacing-12)">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-(--spacing-12)">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 이미지 URL
          <img src={thumbnailUrl} alt="" className="size-14 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="size-14 shrink-0 rounded-md bg-background-skeleton" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-(--spacing-8)">
          <span className="heading-sm truncate text-text-default">{title}</span>
          <span className="label-md truncate text-text-tertiary">{meta}</span>
        </span>
      </Link>
      {(onEdit || onDelete) && (
        <div className="flex">
          {onEdit && <IconButton icon="edit" label={`${title} 수정`} iconSize={20} iconClassName="text-icon-secondary" onClick={onEdit} />}
          {onDelete && (
            <IconButton icon="delete" label={`${title} 삭제`} iconSize={20} iconClassName="text-icon-error" onClick={onDelete} />
          )}
        </div>
      )}
    </div>
  );
}
