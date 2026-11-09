import "server-only";
import type { Product, ProductImage } from "@/lib/products";
import { ApiError } from "./http";
import { publicImage, supabase } from "./supabase";

type Db = Awaited<ReturnType<typeof supabase>>;
const fields = "id,name,description,event_at,address,capacity,price,cancel_policy,sponsor_disclosure";
const selection = `${fields},product_image(variant,image_path)`;
type Row = Omit<Product, "images"> & { product_image: { variant: ProductImage; image_path: string }[] };

function product({ product_image, ...data }: Row): Product {
  return {
    ...data,
    images: Object.fromEntries(product_image.map(({ variant, image_path }) => [
      variant, publicImage("product-image", image_path.split("/").map(encodeURIComponent).join("/")),
    ])),
  };
}

export async function listProducts(db: Db) {
  const { data, error } = await db.from("product").select(selection).eq("publication_status", "PUBLIC").order("created_at", { ascending: false }).returns<Row[]>();
  if (error) throw new ApiError(502, "상품 목록을 불러오지 못했어요.");
  return data.map(product);
}

export async function getProduct(db: Db, id: string) {
  const { data, error } = await db.from("product").select(selection).eq("id", id).eq("publication_status", "PUBLIC").maybeSingle<Row>();
  if (error) throw new ApiError(502, "상품 정보를 불러오지 못했어요.");
  if (!data) throw new ApiError(404, "공개된 상품을 찾지 못했어요.");
  return product(data);
}
