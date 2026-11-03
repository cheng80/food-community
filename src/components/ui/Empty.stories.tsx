import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Empty } from "./Empty";

const meta = {
  title: "UI/Empty",
  component: Empty,
  args: { onPrimary: fn(), onSecondary: fn() },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "저장하기" }));
    await expect(args.onPrimary).toHaveBeenCalledOnce();
  },
};
export const WithoutActions: Story = { args: { onPrimary: undefined, onSecondary: undefined } };
