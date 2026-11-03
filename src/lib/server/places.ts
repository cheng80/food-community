import "server-only";
import type { supabase } from "./supabase";
import { publicImage } from "./supabase";

type Db = Awaited<ReturnType<typeof supabase>>;
interface PlaceRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  address: string;
  created_at: string;
  place_image: { image_path: string; position: number }[];
}

const COLUMNS = "id,user_id,title,content,address,created_at,place_image(image_path,position)";

function toRestaurant(row: PlaceRow) {
  const paths = [...row.place_image].sort((a, b) => a.position - b.position).map((image) => image.image_path);
  return {
    id: row.id,
    name: row.title,
    address: row.address,
    content: row.content,
    authorId: row.user_id,
    createdAt: Date.parse(row.created_at),
    photos: paths.map((path) => publicImage("place-image", path)!),
    photoPaths: paths,
  };
}

// ponytail: 최신 1000개를 한 번에 내려 클라이언트에서 검색·페이징한다. 글이 더 늘면 커서 페이지네이션 API로 옮긴다.
export async function listPlaces(db: Db) {
  const { data, error } = await db.from("place").select(COLUMNS).is("deleted_at", null).order("created_at", { ascending: false }).limit(1000);
  if (error) return { error };
  return { data: (data as PlaceRow[]).map(toRestaurant) };
}

export async function getPlace(db: Db, id: string) {
  const { data, error } = await db.from("place").select(COLUMNS).is("deleted_at", null).eq("id", id).maybeSingle();
  if (error) return { error };
  return { data: data && toRestaurant(data as PlaceRow) };
}
