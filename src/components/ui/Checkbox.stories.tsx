import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  args: { label: "약관에 동의합니다", size: "md", onChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const box = canvas.getByRole("checkbox", { name: "약관에 동의합니다" });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = {
  args: { indeterminate: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox")).toHaveProperty("indeterminate", true);
  },
};
export const ErrorState: Story = { args: { error: true } };
export const Disabled: Story = { args: { disabled: true } };

/** state(default/disabled/error) × checked × size */
export const Matrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(["sm", "md"] as const).map((size) =>
        [{}, { defaultChecked: true }, { indeterminate: true }].map((value, i) => (
          <div key={`${size}-${i}`} className="flex gap-6">
            {[{}, { disabled: true }, { error: true }].map((state, j) => (
              <Checkbox key={j} {...args} size={size} {...value} {...state} />
            ))}
          </div>
        )),
      )}
    </div>
  ),
};
