import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Menu, MenuItem } from "./Menu";

const meta = {
  title: "UI/Menu",
  component: Menu,
  args: { children: null },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const onEdit = fn();

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuItem icon="edit" onClick={onEdit}>
        수정하기
      </MenuItem>
      <MenuItem icon="delete" variant="destructive">
        삭제하기
      </MenuItem>
    </Menu>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("menuitem", { name: "수정하기" }));
    await expect(onEdit).toHaveBeenCalledOnce();
  },
};

/** UI / Menu Item — default · destructive × default · disabled × sm/md/lg */
export const Items: Story = {
  render: () => (
    <div className="flex gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} role="menu" aria-label={`menu-item ${size}`} className="flex flex-col">
          <MenuItem size={size} icon="edit">
            수정하기
          </MenuItem>
          <MenuItem size={size} icon="edit" disabled>
            수정하기
          </MenuItem>
          <MenuItem size={size} icon="delete" variant="destructive">
            삭제하기
          </MenuItem>
          <MenuItem size={size} icon="delete" variant="destructive" disabled>
            삭제하기
          </MenuItem>
        </div>
      ))}
    </div>
  ),
};
