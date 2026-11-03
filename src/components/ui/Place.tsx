import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";

/** design.pen map/center-pin. 지도 위 중앙에 고정하며 끝점이 좌표를 가리킨다. */
export function MapCenterPin({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cx("pointer-events-none flex flex-col items-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-full border-[3px] border-border-surface bg-background-brand shadow-md">
        <Icon name="map-pin" size={16} className="text-icon-on-brand" />
      </span>
      <span className="h-3.5 w-[3px] bg-background-brand" />
      <span className="h-1 w-2 rounded-full bg-background-overlay" />
    </span>
  );
}

export interface PlaceResultItemProps {
  name: string;
  address: string;
  onClick?: () => void;
}

/** design.pen place/result-item */
export function PlaceResultItem({ name, address, onClick }: PlaceResultItemProps) {
  return (
    <button type="button" onClick={onClick} className="flex w-full cursor-pointer flex-col gap-(--spacing-8) border-b border-border-default py-(--spacing-12) text-left">
      <span className="label-lg text-text-default">{name}</span>
      <span className="body-md text-text-secondary">{address}</span>
    </button>
  );
}

export interface PlaceSummaryProps {
  name: string;
  address: string;
  onChange?: () => void;
  className?: string;
}

/** design.pen place/summary */
export function PlaceSummary({ name, address, onChange, className }: PlaceSummaryProps) {
  return (
    <div className={cx("flex items-center gap-(--spacing-12) rounded-lg border border-border-default p-(--spacing-12)", className)}>
      <Icon name="map-pin" size={20} className="shrink-0 text-icon-brand" />
      <div className="flex min-w-0 flex-1 flex-col gap-(--spacing-8)">
        <span className="label-lg truncate text-text-default">{name}</span>
        <span className="label-md text-text-secondary">{address}</span>
      </div>
      {onChange && (
        <button type="button" onClick={onChange} className="label-md shrink-0 cursor-pointer text-text-brand">
          변경
        </button>
      )}
    </div>
  );
}

export interface AddressBoxProps {
  status: "default" | "loading" | "error";
  children: ReactNode;
  label?: string;
  className?: string;
}

/** design.pen place/address-box */
export function AddressBox({ status, children, label = "이 위치의 지번 주소", className }: AddressBoxProps) {
  return (
    <div aria-live="polite" className={cx("flex flex-col gap-(--spacing-8) rounded-xl border border-border-default p-(--spacing-16)", className)}>
      <span className="label-md text-text-secondary">{label}</span>
      <div className="flex items-center gap-(--spacing-8)">
        {status === "loading" ? <Spinner size={16} className="text-icon-secondary" /> : <Icon name={status === "error" ? "error" : "map-pin"} size={16} className={status === "error" ? "text-icon-error" : "text-icon-brand"} />}
        <span className={cx("label-lg", status === "error" ? "text-text-error" : status === "loading" ? "text-text-tertiary" : "text-text-default")}>{children}</span>
      </div>
    </div>
  );
}
