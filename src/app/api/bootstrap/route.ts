import { api, ApiError } from "@/lib/server/http";
import { listPlaces } from "@/lib/server/places";
import { currentUser, publicImage } from "@/lib/server/supabase";

const NO_NICKNAME = "맛집 이웃";

export async function GET() {
  return api(async () => {
    const { db, user } = await currentUser();
    const [{ data, error }, places] = await Promise.all([db.from("profile").select("user_id,nickname,image_path"), listPlaces(db)]);
    if (error || !data || places.error) throw new ApiError(502, "데이터 연결을 확인해 주세요.");
    const users = data.map((p) => ({ id: p.user_id, nickname: p.nickname || NO_NICKNAME, avatarUrl: publicImage("profile-image", p.image_path) }));
    const me = user ? (users.find((p) => p.id === user.id) ?? { id: user.id, nickname: NO_NICKNAME }) : { id: "", nickname: "방문자" };
    return { loggedIn: !!user, me, users, restaurants: places.data };
  });
}
