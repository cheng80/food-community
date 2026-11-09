import { api } from "@/lib/server/http";
import { listProducts } from "@/lib/server/products";
import { currentUser } from "@/lib/server/supabase";

export async function GET() {
  return api(async () => ({ products: await listProducts((await currentUser()).db) }));
}
