import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgramMedia } from "./ProgramMedia";

export default { title: "Program/Media", component: ProgramMedia } satisfies Meta<typeof ProgramMedia>;
export const Responsive: StoryObj<typeof ProgramMedia> = {
  args: { mobile: "/images/generated/kalguksu-v1.png", desktop: "/images/generated/haemul-pajeon-v1.png", alt: "수업 이미지 예시" },
};
