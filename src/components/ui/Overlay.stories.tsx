import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen } from "storybook/test";
import { Button } from "./Button";
import { BottomSheet, Modal } from "./Overlay";

const meta = {
  title: "UI/Overlay",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onConfirm = fn();

function ModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-4">
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        삭제
      </Button>
      <Modal
        open={open}
        title="삭제할까요?"
        description="삭제한 내용은 복구할 수 없습니다."
        confirmLabel="저장하기"
        actionIcon="plus"
        onConfirm={onConfirm}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function BottomSheetDemo() {
  const [open, setOpen] = useState(true);
  return (
    <BottomSheet open={open} title="지역 선택" onClose={() => setOpen(false)}>
      <p className="body-md text-text-default">서울 · 경기 · 인천</p>
    </BottomSheet>
  );
}

export const ModalDefault: Story = {
  name: "Modal",
  render: () => <ModalDemo />,
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole("button", { name: "저장하기" }));
    await expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.keyboard("{Escape}");
    await expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    await expect(screen.getByRole("dialog", { name: "삭제할까요?" })).toBeVisible();
  },
};

export const ModalBusy: Story = {
  name: "Modal Busy",
  render: () => <Modal open busy title="삭제할까요?" description="처리 중에는 닫거나 다시 누를 수 없어요." confirmLabel="삭제" onConfirm={onConfirm} onClose={onConfirm} />,
  play: async ({ userEvent }) => {
    onConfirm.mockClear();
    await expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled();
    await expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    await expect(onConfirm).not.toHaveBeenCalled();
  },
};

export const BottomSheetDefault: Story = {
  name: "Bottom Sheet",
  render: () => <BottomSheetDemo />,
  play: async () => {
    await expect(screen.getByRole("dialog", { name: "지역 선택" })).toBeVisible();
  },
};
