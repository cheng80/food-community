import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen } from "storybook/test";
import { Button } from "./Button";
import { PaymentCancelSheet, PaymentHistoryItem, ProgramBanner, ProgramHero, ProgramInfoRow, SampleNotice, SummaryRow } from "./Payment";

const meta = { title: "UI/Payment" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onAction = fn();

export const Banner: Story = {
  render: () => <ProgramBanner href="/programs/sushi-bento" label="심심한 주말 놓치지 아까운 기회, 요리 수업 알아보기" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /요리 수업 알아보기/ })).toBeVisible();
  },
};

export const Hero: Story = {
  render: () => <ProgramHero mobile="/images/program/hero-720x360.png" desktop="/images/program/hero-2480x806.png" alt="도시락과 초밥, 소스 그릇" />,
};

const narrow = (Story: () => React.ReactNode) => <div className="w-[328px]">{Story()}</div>;

export const Notice: Story = { decorators: [narrow], render: () => <SampleNotice /> };

export const InfoRow: Story = {
  decorators: [narrow],
  render: () => <ProgramInfoRow icon="calendar" label="일시" value="2026년 11월 21일 (토) 오후 2시" />,
};

export const Summary: Story = { decorators: [narrow], render: () => <SummaryRow label="참가비" value="35,000원 (샘플)" /> };

export const HistoryPaid: Story = {
  name: "History / Paid",
  decorators: [narrow],
  render: () => (
    <PaymentHistoryItem
      href="/programs/sushi-bento"
      title="초밥 도시락 쿠킹 클래스"
      meta="11월 21일 (토) 오후 2시 · 샘플 카드"
      amount="35,000원"
      status="paid"
      onCancel={onAction}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /샘플 취소/ }));
    await expect(onAction).toHaveBeenCalledOnce();
  },
};

export const HistoryCancelled: Story = {
  name: "History / Cancelled",
  decorators: [narrow],
  render: () => <PaymentHistoryItem href="/programs/kalguksu-talk" title="칼국수 한 그릇 강연" meta="11월 3일 취소 · 환불 완료 표시(샘플)" amount="15,000원" status="cancelled" />,
};

export const HistoryRefundFailed: Story = {
  name: "History / Refund Failed",
  decorators: [narrow],
  render: () => <PaymentHistoryItem href="/programs/drive-meetup" title="주말 드라이브 맛집 모임" meta="운영자 확인이 필요한 상태 예시" amount="25,000원" status="refund_failed" />,
};

const onConfirmCancel = fn();

function CancelSheetDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>시트 열기</Button>
      <PaymentCancelSheet
        open={open}
        title="초밥 도시락 쿠킹 클래스"
        amount="35,000원"
        method="샘플 카드"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirmCancel();
          setOpen(false);
        }}
      />
    </>
  );
}

export const CancelSheet: Story = {
  name: "Cancel Sheet",
  render: () => <CancelSheetDemo />,
  play: async ({ userEvent }) => {
    onConfirmCancel.mockClear();
    const dialog = () => screen.getByRole("dialog", { name: "샘플 결제를 취소할까요?" });
    const opener = screen.getByRole("button", { name: "시트 열기" });

    await expect(dialog()).toHaveFocus();
    await expect(dialog()).toHaveTextContent("실제 결제와 환불은 일어나지 않아요");

    await userEvent.keyboard("{Escape}");
    await expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(opener);
    await userEvent.tab();
    await expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
    await userEvent.tab();
    await expect(screen.getByRole("button", { name: "샘플 취소" })).toHaveFocus();
    await userEvent.tab();
    await expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(opener).toHaveFocus();

    await userEvent.click(opener);
    await userEvent.dblClick(screen.getByRole("button", { name: "샘플 취소" }));
    await expect(onConfirmCancel).toHaveBeenCalledOnce();
    await expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
