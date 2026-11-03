import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { GoogleLoginButton } from "./GoogleLoginButton";

const meta = {
  title: "UI/Google Login Button",
  component: GoogleLoginButton,
  args: { onClick: fn() },
} satisfies Meta<typeof GoogleLoginButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Google 계정으로 로그인" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
