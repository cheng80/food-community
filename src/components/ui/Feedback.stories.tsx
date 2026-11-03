import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Badge, Skeleton, Toast } from "./Feedback";
import { Spinner } from "./Spinner";

const meta = {
  title: "UI/Feedback",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpinnerMd: Story = {
  name: "Spinner",
  render: () => <Spinner />,
};

export const Skeletons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton shape="text" />
      <Skeleton shape="rectangle" />
      <Skeleton shape="circle" />
    </div>
  ),
};

const onClose = fn();

export const Toasts: Story = {
  render: () => (
    <div className="flex w-[400px] flex-col gap-3">
      <Toast variant="success" message="저장되었습니다" onClose={onClose} />
      <Toast variant="error" message="저장에 실패했습니다" onClose={onClose} />
      <Toast variant="info" message="새 알림이 있습니다" onClose={onClose} />
      <Toast variant="warning" message="입력을 확인해 주세요" onClose={onClose} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button", { name: "닫기" })[0]);
    await expect(onClose).toHaveBeenCalledOnce();
  },
};

/** 03 등록 — 컨테이너 폭을 채우는 오류 배너 (여러 줄) */
export const ErrorBanner: Story = {
  render: () => (
    <div className="w-[320px]">
      <Toast variant="error" message={"필수 항목 3개를 확인해 주세요\n빨간색으로 표시된 항목을 채우면 등록할 수 있어요."} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert").getBoundingClientRect().width).toBe(320);
  },
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["md", "lg"] as const).map((size) => (
        <div key={size} className="flex gap-2">
          <Badge size={size}>기본</Badge>
          <Badge size={size} variant="success">
            완료
          </Badge>
          <Badge size={size} variant="error">
            오류
          </Badge>
          <Badge size={size} variant="info">
            안내
          </Badge>
          <Badge size={size} variant="warning">
            주의
          </Badge>
        </div>
      ))}
    </div>
  ),
};
