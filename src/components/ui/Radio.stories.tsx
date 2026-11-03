import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Radio } from "./Radio";

const meta = {
  title: "UI/Radio",
  component: Radio,
  args: { label: "매장 방문", name: "visit", size: "md" },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Group: Story = {
  render: (args) => (
    <div role="radiogroup" aria-label="방문 유형" className="flex gap-6">
      <Radio {...args} value="store" label="매장 방문" />
      <Radio {...args} value="pickup" label="포장" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const pickup = canvas.getByRole("radio", { name: "포장" });
    await userEvent.click(pickup);
    await expect(pickup).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "매장 방문" })).not.toBeChecked();
  },
};
export const Selected: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const SelectedDisabled: Story = { args: { disabled: true, defaultChecked: true } };
export const Small: Story = { args: { size: "sm", defaultChecked: true } };
