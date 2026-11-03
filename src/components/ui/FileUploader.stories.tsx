import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { FileItem, FileUploader } from "./FileUploader";

const meta = {
  title: "UI/File Uploader",
  component: FileUploader,
  args: { onFiles: fn(), className: "w-[210px]" },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <FileItem name="방문사진.jpg" status="complete" /> },
  play: async ({ canvas, userEvent, args }) => {
    const file = new File(["x"], "새사진.png", { type: "image/png" });
    await userEvent.upload(canvas.getByLabelText("사진 * 0/5"), file);
    await expect(args.onFiles).toHaveBeenCalledWith([file]);
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = { args: { errorText: "사진을 1장 이상 올려 주세요." } };

export const FileItems: Story = {
  render: () => (
    <div className="flex w-[260px] flex-col">
      <FileItem name="방문사진.jpg" status="error" onRemove={fn()} />
      <FileItem name="방문사진.jpg" status="uploading" onRemove={fn()} />
      <FileItem name="방문사진.jpg" status="complete" onRemove={fn()} />
    </div>
  ),
};
