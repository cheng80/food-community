import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { BottomSheet } from "./Overlay";

export interface InstallBannerProps {
  description: string;
  actionLabel: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

/** 앱 설치 안내 배너 */
export function InstallBanner({ description, actionLabel, onAction, onDismiss }: InstallBannerProps) {
  return (
    <section aria-label="앱 설치 안내" className="flex items-center gap-(--spacing-12) rounded-xl border border-border-default bg-background-default p-(--spacing-12)">
      <p className="body-md min-w-0 flex-1 text-text-default">{description}</p>
      <Button size="sm" onClick={onAction} className="shrink-0">{actionLabel}</Button>
      <IconButton icon="close" label="설치 안내 닫기" onClick={onDismiss} />
    </section>
  );
}

export interface IosInstallSheetProps {
  open: boolean;
  onClose?: () => void;
}

/** iOS Safari는 설치 API가 없어 직접 추가하는 방법을 안내한다. */
export function IosInstallSheet({ open, onClose }: IosInstallSheetProps) {
  return (
    <BottomSheet open={open} title="홈 화면에 추가하기" onClose={onClose}>
      <ol className="body-md flex w-full list-decimal flex-col gap-(--spacing-8) pl-(--spacing-20) text-text-default">
        <li>Safari 아래쪽의 공유 버튼을 누르세요.</li>
        <li>목록에서 &lsquo;홈 화면에 추가&rsquo;를 고르세요.</li>
        <li>오른쪽 위의 &lsquo;추가&rsquo;를 누르세요.</li>
      </ol>
      <Button variant="secondary" className="w-full" onClick={onClose}>닫기</Button>
    </BottomSheet>
  );
}
