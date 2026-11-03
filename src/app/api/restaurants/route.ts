import { api, checkOrigin, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { placeInput, saveError } from "./input";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const session = await requireUser();
    const input = await placeInput(session, await json(request));
    const { data, error } = await session.db.rpc("save_place", { p_id: null, ...input }).single<{ id: string }>();
    if (error) throw saveError(error);
    return { id: data.id };
  }, 201);
}
