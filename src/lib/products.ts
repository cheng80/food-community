export type ProductImage = "banner_mobile" | "banner_desktop" | "hero_mobile" | "hero_desktop";

export interface Product {
  id: string;
  name: string;
  description: string;
  event_at: string;
  address: string;
  capacity: number;
  price: number;
  cancel_policy: string;
  sponsor_disclosure: string;
  images: Partial<Record<ProductImage, string>>;
}

export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
