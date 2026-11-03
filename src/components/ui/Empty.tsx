import { Button } from "./Button";
import { Icon } from "./Icon";

export interface EmptyProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function Empty({
  title = "아직 등록된 맛집이 없어요",
  description = "첫 맛집을 등록해 주세요",
  primaryLabel = "저장하기",
  secondaryLabel = "취소",
  onPrimary,
  onSecondary,
}: EmptyProps) {
  return (
    <div className="flex w-[260px] flex-col items-center gap-3">
      <Icon name="image" size={32} className="text-icon-secondary" />
      <h3 className="heading-sm text-text-default">{title}</h3>
      <p className="body-md text-text-secondary">{description}</p>
      {onPrimary && (
        <Button size="sm" icon="plus" onClick={onPrimary} className="w-[170px]">
          {primaryLabel}
        </Button>
      )}
      {onSecondary && (
        <Button variant="secondary" size="sm" icon="plus" onClick={onSecondary} className="w-[170px]">
          {secondaryLabel}
        </Button>
      )}
    </div>
  );
}
