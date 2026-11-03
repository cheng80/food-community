import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { AddressBox, MapCenterPin, PlaceResultItem, PlaceSummary } from "./Place";

const meta = {
  title: "UI/Place",
  decorators: [(Story) => <div className="w-[328px]">{Story()}</div>],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onClick = fn();

export const CenterPin: Story = { name: "Center Pin", render: () => <MapCenterPin /> };

export const ResultItem: Story = {
  name: "Result Item",
  render: () => <PlaceResultItem name="광명 할매 손칼국수" address="경기도 광명시 철산동 123-4" onClick={onClick} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /광명 할매 손칼국수/ }));
    await expect(onClick).toHaveBeenCalledOnce();
  },
};

export const Summary: Story = { render: () => <PlaceSummary name="광명 할매 손칼국수" address="경기도 광명시 철산동 123-4" onChange={fn()} /> };

export const Address: Story = {
  name: "Address Box",
  render: () => (
    <div className="flex flex-col gap-(--spacing-12)">
      <AddressBox status="default">서울특별시 중구 태평로1가 31</AddressBox>
      <AddressBox status="loading">주소를 확인하는 중이에요</AddressBox>
      <AddressBox status="error">주소를 찾을 수 없는 위치예요</AddressBox>
    </div>
  ),
};
