import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen } from "storybook/test";
import { InstallBanner, IosInstallSheet } from "./InstallBanner";

const meta = { title: "UI/Install Banner", decorators: [(Story) => <div className="w-[328px]">{Story()}</div>] } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onAction = fn();
const onDismiss = fn();

export const Android: Story = {
  render: () => <InstallBanner description="홈 화면에 추가하고 바로 열어 보세요" actionLabel="설치" onAction={onAction} onDismiss={onDismiss} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "설치" }));
    await expect(onAction).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "설치 안내 닫기" }));
    await expect(onDismiss).toHaveBeenCalledOnce();
  },
};

export const IosSheet: Story = {
  name: "iOS Sheet",
  render: () => <IosInstallSheet open onClose={fn()} />,
  play: async () => {
    await expect(screen.getByRole("dialog", { name: "홈 화면에 추가하기" })).toBeVisible();
  },
};
