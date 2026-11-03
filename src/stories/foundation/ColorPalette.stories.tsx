import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { alias, colorPrimitives, colorSemantics, resolve } from "./tokens";

const meta = {
  title: "Foundation/Color Palette",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const groupBy = <T extends { name: string }>(list: T[], key: (name: string) => string) =>
  Object.entries(Object.groupBy(list, (t) => key(t.name))) as [string, T[]][];

function Swatch({ name, value, size }: { name: string; value: string; size: "lg" | "sm" }) {
  return (
    <div className={size === "lg" ? "w-20" : "w-44"}>
      <div
        className={`rounded-lg border border-border-default ${size === "lg" ? "size-20" : "h-12 w-full"}`}
        style={{ background: resolve(value) }}
      />
      <p className="label-md mt-1 break-all text-text-default">{name.replace(/^color-/, "")}</p>
      <p className="label-md text-text-tertiary">{alias(value) ?? value}</p>
    </div>
  );
}

/** 각 컬러별 1행, 프리미티브 토큰 1개당 정사각형 1개 */
export const Primitives: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {groupBy(colorPrimitives, (n) => n.split("-")[1]).map(([family, list]) => (
        <section key={family}>
          <h2 className="heading-sm mb-2 text-text-default">{family}</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((t) => (
              <Swatch key={t.name} {...t} size="lg" />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Semantic: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {groupBy(colorSemantics, (n) => n.split("-")[1]).map(([group, list]) => (
        <section key={group}>
          <h2 className="heading-sm mb-2 text-text-default">{group}</h2>
          <div className="flex flex-wrap gap-3">
            {list.map((t) => (
              <Swatch key={t.name} {...t} size="sm" />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
