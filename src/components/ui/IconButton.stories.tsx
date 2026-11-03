import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { IconButton } from "./IconButton";

const meta = {
  title: "UI/Icon Button",
  component: IconButton,
  args: { icon: "heart", label: "좋아요", variant: "ghost", onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "좋아요" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const CircleBrand: Story = { args: { variant: "circle-brand" } };
export const CircleNeutral: Story = { args: { variant: "circle-neutral" } };
/** 05 마이 페이지 · Post Actions (20px, secondary / error) */
export const PostActions: Story = {
  render: () => (
    <div className="flex">
      <IconButton icon="edit" label="수정" iconSize={20} iconClassName="text-icon-secondary" />
      <IconButton icon="delete" label="삭제" iconSize={20} iconClassName="text-icon-error" />
    </div>
  ),
};
