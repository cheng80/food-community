import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/lib/data";

/** design.pen 05 마이 / 06 프로필 · Profile */
export function ProfileSummary({ user, count }: { user: User; count: number }) {
  return (
    <section className="flex items-center gap-(--spacing-16) px-(--spacing-20) py-(--spacing-24)">
      <Avatar size="lg" src={user.avatarUrl} alt={`${user.nickname} 프로필 사진`} />
      <div className="flex min-w-0 flex-1 flex-col gap-(--spacing-8)">
        <h2 className="heading-md truncate text-text-default">{user.nickname}</h2>
        <p className="body-md text-text-secondary">지금까지 맛집 {count}곳을 공유했어요</p>
      </div>
    </section>
  );
}
