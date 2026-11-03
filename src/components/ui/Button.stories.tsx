import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "저장하기", icon: "plus", variant: "primary", size: "md", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "저장하기" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Secondary: Story = { args: { variant: "secondary", children: "취소" } };
export const Destructive: Story = { args: { variant: "destructive", children: "삭제하기" } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button")).toBeDisabled();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status")).toBeInTheDocument();
  },
};

/** variant × state × size (sm 32 / md 40 / lg 48) */
export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["primary", "secondary", "destructive"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          {(["sm", "md", "lg"] as const).map((size) => (
            <div key={size} className="flex gap-2">
              {[{}, { disabled: true }, { loading: true }].map((state, i) => (
                <Button key={i} variant={variant} size={size} icon="plus" className="w-[170px]" {...state}>
                  {variant === "primary" ? "저장하기" : variant === "secondary" ? "취소" : "삭제하기"}
                </Button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
