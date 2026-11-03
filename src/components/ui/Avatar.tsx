import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

const sizes = {
  sm: { box: "size-7", icon: 16 },
  lg: { box: "size-16 border border-border-default", icon: 32 },
} as const;

export interface AvatarProps {
  src?: string;
  /** sm 28 (02 상세 작성자) / lg 64 (05 마이 프로필) */
  size?: keyof typeof sizes;
  alt?: string;
  className?: string;
}

export function Avatar({ src, size = "sm", alt = "", className }: AvatarProps) {
  const s = sizes[size];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 이미지 URL
    <img src={src} alt={alt} className={cx("shrink-0 rounded-full object-cover", s.box, className)} />
  ) : (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={cx("flex shrink-0 items-center justify-center rounded-full bg-background-skeleton", s.box, className)}
    >
      <Icon name="user" size={s.icon} className="text-icon-secondary" />
    </span>
  );
}
