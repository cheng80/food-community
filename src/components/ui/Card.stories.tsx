import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "./Card";

const meta = {
  title: "UI/Card",
  component: Card,
  args: {
    title: "광명 할매 손칼국수",
    address: "경기 광명시 광명로",
    description: "방문 후기를 확인하세요.",
    meta: "주말드라이버 · 2시간 전",
    className: "w-[280px]",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
