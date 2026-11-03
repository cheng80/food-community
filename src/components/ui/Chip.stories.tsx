import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Chip, type ChipProps } from "./Chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  args: { children: "한식", size: "md" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Small: Story = { args: { size: "sm", selected: true } };

/** 칩 나열 간격 spacing-8 */
function ChipGroup(args: ChipProps) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="flex gap-(--spacing-8)">
      {["한식", "중식", "일식"].map((label) => (
        <Chip
          key={label}
          {...args}
          selected={selected.includes(label)}
          onClick={() => setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]))}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}

export const Toggle: Story = {
  render: (args) => <ChipGroup {...args} />,
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "중식" });
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
};
