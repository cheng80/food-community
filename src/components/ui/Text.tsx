import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

export const textVariants = [
  "display-lg",
  "display-md",
  "display-sm",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "body-lg",
  "body-md",
  "label-lg",
  "label-md",
] as const;
export type TextVariant = (typeof textVariants)[number];

const defaultTag: Record<TextVariant, ElementType> = {
  "display-lg": "h1",
  "display-md": "h1",
  "display-sm": "h1",
  "heading-lg": "h1",
  "heading-md": "h2",
  "heading-sm": "h3",
  "body-lg": "p",
  "body-md": "p",
  "label-lg": "span",
  "label-md": "span",
};

export interface TextProps {
  variant?: TextVariant;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** 색상 기본값 text-text-default, className으로 덮어쓰기 */
export function Text({ variant = "body-md", as, className, children }: TextProps) {
  const Tag = as ?? defaultTag[variant];
  return <Tag className={cx(variant, className ?? "text-text-default")}>{children}</Tag>;
}
