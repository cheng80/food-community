import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { photos } from "@/lib/data";
import { PostRow } from "./PostRow";

const meta = {
  title: "UI/Post Row",
  component: PostRow,
  decorators: [(Story) => <div className="w-[320px]">{Story()}</div>],
  args: {
    title: "광명 할매 손칼국수",
    meta: "경기 광명시 광명로 · 2시간 전",
    href: "/restaurants/gwangmyeong-kalguksu",
    thumbnailUrl: photos.kalguksu,
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof PostRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "광명 할매 손칼국수 삭제" }));
    await expect(args.onDelete).toHaveBeenCalledOnce();
  },
};
export const ReadOnly: Story = { args: { onEdit: undefined, onDelete: undefined } };
