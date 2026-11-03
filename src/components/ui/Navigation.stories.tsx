import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { BottomNavigation, TabNavigation, TopNavigation } from "./Navigation";

const meta = {
  title: "UI/Navigation",
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[360px] border border-border-default">{Story()}</div>],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onBack = fn();

function BottomDemo() {
  const [active, setActive] = useState("home");
  return <BottomNavigation activeKey={active} onChange={setActive} />;
}

function TabDemo() {
  const [active, setActive] = useState("all");
  return <TabNavigation activeKey={active} onChange={setActive} />;
}

export const Top: Story = {
  render: () => <TopNavigation title="맛집 등록" onBack={onBack} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "뒤로 가기" }));
    await expect(onBack).toHaveBeenCalled();
  },
};

/** 01 메인 헤더 — 홈 / 내 정보 */
export const TopHome: Story = {
  render: () => <TopNavigation title="숨은맛집" backIcon="home" backLabel="홈" moreIcon="user" moreLabel="내 정보" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "홈" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "내 정보" })).toBeVisible();
  },
};

export const Bottom: Story = {
  render: () => <BottomDemo />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "저장" }));
    await expect(canvas.getByRole("button", { name: "저장" })).toHaveAttribute("aria-current", "page");
  },
};

export const Tab: Story = {
  render: () => <TabDemo />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "저장한 맛집" }));
    await expect(canvas.getByRole("tab", { name: "저장한 맛집" })).toHaveAttribute("aria-selected", "true");
  },
};
