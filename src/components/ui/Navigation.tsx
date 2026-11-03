import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface TopNavigationProps {
  title: string;
  onBack?: () => void;
  onMore?: () => void;
  backIcon?: IconName;
  backLabel?: string;
  moreIcon?: IconName;
  moreLabel?: string;
  className?: string;
}

/** 배경은 전체 폭, 내용은 max-w-page(1280px)까지만 */
export function TopNavigation({
  title,
  onBack,
  onMore,
  backIcon = "arrow-left",
  backLabel = "뒤로 가기",
  moreIcon = "more-horizontal",
  moreLabel = "더보기",
  className,
}: TopNavigationProps) {
  return (
    <header className={cx("w-full bg-background-default", className)}>
      <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between px-4">
        <button type="button" aria-label={backLabel} onClick={onBack} className="flex size-6 cursor-pointer items-center justify-center">
          <Icon name={backIcon} size={24} />
        </button>
        <h1 className="heading-sm truncate px-2 text-text-default">{title}</h1>
        <button type="button" aria-label={moreLabel} onClick={onMore} className="flex size-6 cursor-pointer items-center justify-center">
          <Icon name={moreIcon} size={24} />
        </button>
      </div>
    </header>
  );
}

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
}

export interface BottomNavigationProps {
  items?: NavItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  className?: string;
}

const defaultBottomItems: NavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "saved", label: "저장", icon: "bookmark" },
  { key: "me", label: "내 정보", icon: "user" },
];

export function BottomNavigation({ items = defaultBottomItems, activeKey, onChange, className }: BottomNavigationProps) {
  return (
    <nav aria-label="하단 메뉴" className={cx("w-full bg-background-default", className)}>
      <div className="mx-auto flex h-14 w-full max-w-page">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange?.(item.key)}
              className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5"
            >
              <Icon name={item.icon} size={24} className={active ? "text-icon-brand" : "text-icon-secondary"} />
              <span className={cx("label-md", active ? "text-text-brand" : "text-text-secondary")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export interface TabNavigationProps {
  tabs?: { key: string; label: string }[];
  activeKey: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs = [
    { key: "all", label: "전체" },
    { key: "saved", label: "저장한 맛집" },
  ],
  activeKey,
  onChange,
  className,
}: TabNavigationProps) {
  return (
    <div role="tablist" className={cx("flex h-12 bg-background-default", className)}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.key)}
            className={cx(
              "label-lg flex w-[120px] cursor-pointer flex-col items-center text-text-default",
              active ? "justify-end" : "justify-center",
            )}
          >
            {tab.label}
            {active && <span className="h-0.5 w-full bg-background-brand" />}
          </button>
        );
      })}
    </div>
  );
}
