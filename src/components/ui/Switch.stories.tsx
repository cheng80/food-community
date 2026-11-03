import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Switch } from "./Switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  args: { label: "알림 받기", size: "md" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "알림 받기" });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const OnDisabled: Story = { args: { disabled: true, defaultChecked: true } };
export const Small: Story = { args: { size: "sm", defaultChecked: true } };
