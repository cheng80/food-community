import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Select } from "./Select";
import { SelectItem } from "./SelectItem";

const meta = {
  title: "UI/Select",
  component: Select,
  args: {
    label: "지역",
    placeholder: "지역을 선택하세요",
    helperText: "지역을 선택해 주세요",
    size: "md",
    className: "w-[220px]",
    options: [
      { value: "seoul", label: "서울" },
      { value: "gyeonggi", label: "경기" },
      { value: "incheon", label: "인천", disabled: true },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("button", { name: /지역/ });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("option", { name: "인천" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("option", { name: "경기" }));
    await expect(args.onChange).toHaveBeenCalledWith("gyeonggi");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await expect(trigger).toHaveTextContent("경기");
  },
};
export const Focused: Story = { args: { defaultOpen: true, defaultValue: "seoul" } };
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = { args: { errorText: "지역은 필수입니다" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/** UI / Select Item — default · selected · disabled × sm/md/lg */
export const Items: Story = {
  render: () => (
    <div className="flex gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} role="listbox" aria-label={`select-item ${size}`} className="flex w-[180px] flex-col border border-border-default">
          <SelectItem size={size}>서울</SelectItem>
          <SelectItem size={size} selected>
            서울
          </SelectItem>
          <SelectItem size={size} disabled>
            서울
          </SelectItem>
        </div>
      ))}
    </div>
  ),
};
