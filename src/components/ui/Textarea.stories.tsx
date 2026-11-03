import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Textarea } from "./Textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: { label: "상세 내용", placeholder: "방문 경험을 공유해 주세요", helperText: "내용을 입력해 주세요", maxLength: 500, className: "w-[220px]" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("상세 내용"), "맛있어요");
    await expect(canvas.getByText("4/500")).toBeVisible();
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = { args: { errorText: "내용은 필수입니다" } };
export const MinLengthCounter: Story = {
  args: { label: "내용 *", counterText: (length) => `${length} / 최소 10자` },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("내용 *"), "맛있어요!");
    await expect(canvas.getByText("5 / 최소 10자")).toBeVisible();
  },
};
