import { useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { IconButton } from "./IconButton";

export interface PhotoSliderProps {
  photos: string[];
  alt: string;
  /** 사진 위 오버레이(상단 내비, 작성자 액션) — 위에서부터 space-between 배치 */
  children?: ReactNode;
  /** 높이 지정 필수 (상세: h-[290px]) */
  className?: string;
}

/** design.pen 02 상세 · Photo Slider — 스와이프(scroll-snap) + 1 / N 카운터 */
export function PhotoSlider({ photos, alt, children, className }: PhotoSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const go = (i: number) => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: "smooth" });

  return (
    <section aria-roledescription="carousel" aria-label={`${alt} 사진`} className={cx("relative overflow-hidden", className)}>
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 이미지 URL
          <img key={i} src={src} alt={`${alt} ${i + 1}`} className="size-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-(--spacing-12) *:pointer-events-auto">
        {children}
        <div className="flex items-center justify-end gap-(--spacing-8)">
          {photos.length > 1 && (
            <div className="hidden gap-(--spacing-8) md:flex">
              <IconButton
                icon="chevron-left"
                label="이전 사진"
                variant="circle-neutral"
                disabled={index === 0}
                onClick={() => go(index - 1)}
              />
              <IconButton
                icon="chevron-right"
                label="다음 사진"
                variant="circle-neutral"
                disabled={index === photos.length - 1}
                onClick={() => go(index + 1)}
              />
            </div>
          )}
          <span className="label-lg rounded-xl bg-background-overlay-strong p-(--spacing-8) text-text-on-image" aria-live="polite">
            {index + 1} / {photos.length}
          </span>
        </div>
      </div>
    </section>
  );
}

export interface PhotoActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

/** 02 상세 · Owner Actions — 사진 위 수정 | 삭제 */
export function PhotoActions({ onEdit, onDelete }: PhotoActionsProps) {
  return (
    <div className="flex h-[34px] items-center gap-(--spacing-12) self-start rounded-[17px] bg-background-overlay px-(--spacing-12)">
      <button type="button" onClick={onEdit} className="label-lg cursor-pointer text-text-on-image">
        수정
      </button>
      <span aria-hidden className="h-2.5 w-px bg-border-on-image" />
      <button type="button" onClick={onDelete} className="label-lg cursor-pointer text-text-on-image">
        삭제
      </button>
    </div>
  );
}
