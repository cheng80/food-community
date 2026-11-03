import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Text, textVariants } from "@/components/ui/Text";

const spec: Record<(typeof textVariants)[number], string> = {
  "display-lg": "font-size-800 (36) / bold / tight 1.2",
  "display-md": "font-size-700 (32) / bold / tight 1.2",
  "display-sm": "font-size-600 (28) / bold / tight 1.2",
  "heading-lg": "font-size-500 (24) / bold / tight 1.2",
  "heading-md": "font-size-400 (20) / bold / tight 1.2",
  "heading-sm": "font-size-300 (16) / semibold / tight 1.2",
  "body-lg": "font-size-300 (16) / regular / normal 1.4",
  "body-md": "font-size-200 (14) / regular / normal 1.4",
  "label-lg": "font-size-200 (14) / semibold / normal 1.4",
  "label-md": "font-size-100 (12) / regular / normal 1.4",
};

const meta = {
  title: "Foundation/Typography",
  component: Text,
  parameters: { layout: "padded" },
  args: { variant: "heading-lg", children: "이번 주말엔 여기 어때요? 숨은맛집 Aa 123" },
  argTypes: { variant: { control: "select", options: textVariants } },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 스타일별 1행 — 공통 자간 -2%, Pretendard Variable */
export const Foundation: Story = {
  render: (args) => (
    <div className="flex flex-col divide-y divide-border-default">
      {textVariants.map((variant) => (
        <div key={variant} className="flex items-baseline gap-6 py-4">
          <div className="w-56 shrink-0">
            <p className="label-lg text-text-default">{variant}</p>
            <p className="label-md text-text-tertiary">{spec[variant]}</p>
          </div>
          <Text variant={variant} as="p">
            {args.children}
          </Text>
        </div>
      ))}
    </div>
  ),
};

export const Playground: Story = {};
