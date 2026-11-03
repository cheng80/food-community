import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { photos } from "@/lib/data";
import { Avatar } from "./Avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  args: { src: photos.avatar, size: "sm" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {};
export const Large: Story = { args: { size: "lg", src: photos.baekban } };
export const Fallback: Story = { args: { size: "lg", src: undefined, alt: "프로필 사진 없음" } };
