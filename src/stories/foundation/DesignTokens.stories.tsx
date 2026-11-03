import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { alias, byPrefix, colorPrimitives, colorSemantics, resolve } from "./tokens";

const meta = {
  title: "Foundation/Design Tokens",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Table({ title, rows }: { title: string; rows: { name: string; value: string; preview?: ReactNode }[] }) {
  return (
    <section className="mb-8">
      <h2 className="heading-md mb-3 text-text-default">{title}</h2>
      <table className="body-md w-full max-w-3xl border-collapse text-left">
        <thead className="label-lg text-text-secondary">
          <tr className="border-b border-border-default">
            <th className="py-2">Token</th>
            <th className="py-2">Value</th>
            <th className="py-2">Preview</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border-default">
              <td className="py-2 font-mono text-[13px]">{r.name}</td>
              <td className="py-2 text-text-secondary">{r.value}</td>
              <td className="py-2">{r.preview}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const swatch = (value: string) => (
  <span className="inline-block size-6 rounded border border-border-default" style={{ background: resolve(value) }} />
);

const spacingUsage: Record<string, string> = {
  "spacing-8": "칩 나열",
  "spacing-12": "리스트, 카드 갭",
  "spacing-16": "화면 좌우 마진, 카드 갭",
  "spacing-20": "",
  "spacing-24": "섹션 구분",
  "spacing-32": "큰 섹션 구분, 페이지 상하 여백",
};

export const Color: Story = {
  render: () => (
    <>
      <Table title="Color — Primitive" rows={colorPrimitives.map((t) => ({ ...t, preview: swatch(t.value) }))} />
      <Table
        title="Color — Semantic"
        rows={colorSemantics.map((t) => ({ name: t.name, value: `${alias(t.value)} (${resolve(t.value)})`, preview: swatch(t.value) }))}
      />
    </>
  ),
};

export const Typography: Story = {
  render: () => (
    <>
      <Table title="Font Family" rows={[{ name: "font-family", value: '"Pretendard Variable"' }]} />
      <Table
        title="Font Size"
        rows={byPrefix("font-size-").map((t) => ({ ...t, preview: <span style={{ fontSize: t.value }}>가나다 Aa</span> }))}
      />
      <Table
        title="Font Weight"
        rows={byPrefix("font-weight-").map((t) => ({ ...t, preview: <span style={{ fontWeight: Number(t.value) }}>가나다 Aa</span> }))}
      />
      <Table title="Line Height" rows={byPrefix("font-line-height-")} />
    </>
  ),
};

export const Spacing: Story = {
  render: () => (
    <Table
      title="Spacing"
      rows={byPrefix("spacing-").map((t) => ({
        name: t.name,
        value: `${t.value}${spacingUsage[t.name] ? ` · ${spacingUsage[t.name]}` : ""}`,
        preview: <span className="block h-4 rounded-sm bg-background-brand" style={{ width: t.value }} />,
      }))}
    />
  ),
};

export const Layout: Story = {
  render: () => <Table title="Layout" rows={byPrefix("container-").map((t) => ({ ...t, value: `${t.value} · 최대 콘텐츠 폭(max-w-page)` }))} />,
};
