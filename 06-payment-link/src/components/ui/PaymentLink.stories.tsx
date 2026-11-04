import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PaymentLink } from "./PaymentLink";

const meta = {
  title: "UI/PaymentLink",
  component: PaymentLink,
  decorators: [(Story) => <div className="mx-auto max-w-sm p-(--spacing-20)"><Story /></div>],
} satisfies Meta<typeof PaymentLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const QR: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "QR결제하기" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("img")).toBeVisible();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};
