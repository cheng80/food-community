import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { TextField } from "./TextField";

const meta = {
  title: "UI/Text Field",
  component: TextField,
  args: {
    label: "맛집 이름",
    placeholder: "식당 이름을 입력하세요",
    helperText: "정확히 입력해 주세요",
    icon: "search",
    size: "md",
    className: "w-60",
    onChange: fn(),
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByLabelText("맛집 이름");
    await userEvent.type(input, "광명 칼국수");
    await expect(input).toHaveValue("광명 칼국수");
    await expect(input).toHaveFocus();
    await expect(args.onChange).toHaveBeenCalled();
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = {
  args: { errorText: "필수 항목입니다" },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("맛집 이름")).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("필수 항목입니다")).toBeVisible();
  },
};
export const Password: Story = { args: { type: "password", label: "비밀번호", placeholder: "••••••••", icon: "user" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <TextField key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
