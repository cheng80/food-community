import type { Metadata } from "next";
import { RestaurantForm } from "../restaurant-form";

export const metadata: Metadata = { title: "맛집 등록" };

export default function NewRestaurantPage() {
  return <RestaurantForm />;
}
