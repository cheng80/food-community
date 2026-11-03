import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icon, iconSizes, icons, type IconName } from "@/components/ui/Icon";

const names = Object.keys(icons) as IconName[];

const meta = {
  title: "Foundation/Iconography",
  component: Icon,
  parameters: { layout: "padded" },
  args: { name: "heart", size: 24 },
  argTypes: {
    name: { control: "select", options: names },
    size: { control: "inline-radio", options: iconSizes },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** lucide · 아이콘 1개당 16/20/24/32 — 20행 단위로 열 분할 */
export const Foundation: Story = {
  render: () => (
    <div className="flex flex-wrap gap-x-16">
      {[names.slice(0, 20), names.slice(20)].map((column, i) => (
        <div key={i} className="flex flex-col">
          {column.map((name) => (
            <div key={name} className="flex h-12 items-center gap-4 border-b border-border-default">
              <span className="label-md w-28 text-text-secondary">{name}</span>
              {iconSizes.map((size) => (
                <span key={size} className="flex w-10 justify-center" title={`icon/${name}/${size}`}>
                  <Icon name={name} size={size} />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Playground: Story = {};
