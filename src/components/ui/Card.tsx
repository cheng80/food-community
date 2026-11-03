import { cx } from "@/lib/cx";

export interface CardProps {
  title: string;
  address: string;
  description: string;
  meta: string;
  imageUrl?: string;
  className?: string;
}

export function Card({ title, address, description, meta, imageUrl, className }: CardProps) {
  return (
    <article
      className={cx("flex w-full flex-col gap-2 rounded-[10px] border border-border-default bg-background-default p-4", className)}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 이미지 URL
        <img src={imageUrl} alt="" className="h-[92px] w-full rounded-md object-cover" />
      ) : (
        <div className="h-[92px] w-full rounded-md bg-background-skeleton" />
      )}
      <h3 className="heading-sm text-text-default">{title}</h3>
      <p className="body-md text-text-secondary">{address}</p>
      <p className="body-md line-clamp-2 text-text-secondary">{description}</p>
      <p className="label-md text-text-tertiary">{meta}</p>
    </article>
  );
}
