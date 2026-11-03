import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Bookmark,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Copy,
  Ellipsis,
  EllipsisVertical,
  Funnel,
  Heart,
  House,
  Image,
  Info,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  TriangleAlert,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

// design.pen icon/<name>/<size> → lucide
export const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  home: House,
  calendar: Calendar,
  copy: Copy,
  refresh: RefreshCw,
  logout: LogOut,
  close: X,
  menu: Menu,
  search: Search,
  filter: Funnel,
  sort: ArrowUpDown,
  "map-pin": MapPin,
  plus: Plus,
  edit: Pencil,
  delete: Trash2,
  bookmark: Bookmark,
  share: Share2,
  "more-horizontal": Ellipsis,
  "more-vertical": EllipsisVertical,
  check: Check,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  user: User,
  settings: Settings,
  notification: Bell,
  heart: Heart,
  star: Star,
  comment: MessageCircle,
  image: Image,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
export const iconSizes = [16, 20, 24, 32] as const;
export type IconSize = (typeof iconSizes)[number];

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  label?: string;
}

/** 색상은 text-icon-* 클래스로 지정 (currentColor) */
export function Icon({ name, size = 24, className, label }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      className={className ?? "text-icon-default"}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
