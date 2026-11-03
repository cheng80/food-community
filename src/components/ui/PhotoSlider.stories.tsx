import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { photos } from "@/lib/data";
import { TopNavigation } from "./Navigation";
import { PhotoActions, PhotoSlider } from "./PhotoSlider";

const meta = {
  title: "UI/Photo Slider",
  component: PhotoSlider,
  parameters: { layout: "fullscreen" },
  args: {
    alt: "광명 할매 손칼국수",
    photos: [photos.kalguksu, photos.wonton, photos.pajeon, photos.baekban],
    className: "h-[290px] w-[360px]",
  },
} satisfies Meta<typeof PhotoSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 02 상세 · Photo Slider (Top Bar + Owner Actions + Counter) */
export const Default: Story = {
  args: {
    children: (
      <>
        <TopNavigation title="광명 할매 손칼국수" />
        <PhotoActions onEdit={fn()} onDelete={fn()} />
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1 / 4")).toBeVisible();
  },
};

export const Wide: Story = {
  args: { className: "h-[420px] w-[720px] rounded-xl" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "다음 사진" }));
    await expect(await canvas.findByText("2 / 4")).toBeVisible();
  },
};
