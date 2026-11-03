"use client";

import { useRouter } from "next/navigation";
import { useBack, useFlashToast } from "@/components/app/hooks";
import { NotFound } from "@/components/app/NotFound";
import { ProfileSummary } from "@/components/app/ProfileSummary";
import { RestaurantGrid } from "@/components/app/RestaurantCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Feedback";
import { TopNavigation } from "@/components/ui/Navigation";
import { findUser, useAppState } from "@/lib/store";

export function ProfileView({ id }: { id: string }) {
  const router = useRouter();
  const back = useBack();
  const state = useAppState();
  const { show, toast } = useFlashToast();
  const user = findUser(state, id);

  if (!user) return <NotFound title="없는 사용자예요" description="탈퇴했거나 주소가 잘못되었어요" />;

  const posts = state.restaurants.filter((r) => r.authorId === id).sort((a, b) => b.createdAt - a.createdAt);
  const isMe = state.loggedIn && id === state.me.id;

  return (
    <>
      <TopNavigation
        title="프로필"
        onBack={back}
        moreIcon="share"
        moreLabel="프로필 링크 복사"
        onMore={() =>
          navigator.clipboard.writeText(window.location.href).then(
            () => show({ variant: "success", message: "프로필 링크를 복사했어요" }),
            () => show({ variant: "error", message: "복사하지 못했어요. 다시 시도해 주세요." }),
          )
        }
      />
      <main className="mx-auto w-full max-w-page flex-1">
        <div className="flex flex-wrap items-center justify-between">
          <ProfileSummary user={user} count={posts.length} />
          {isMe && (
            <div className="px-(--spacing-20) pb-(--spacing-24) sm:pb-0">
              <Button variant="secondary" size="sm" icon="edit" onClick={() => router.push("/me")}>
                프로필 수정
              </Button>
            </div>
          )}
        </div>
        <div className="h-2 bg-background-subtle" />
        <section className="flex flex-col gap-(--spacing-12) px-(--spacing-20) pt-(--spacing-24) pb-(--spacing-32)">
          <div className="flex items-center gap-(--spacing-8)">
            <h2 className="heading-sm text-text-default">작성한 글</h2>
            <Badge>{String(posts.length)}</Badge>
          </div>
          {posts.length > 0 ? (
            <RestaurantGrid restaurants={posts} />
          ) : (
            <p className="body-md py-(--spacing-24) text-center text-text-secondary">아직 작성한 글이 없어요</p>
          )}
        </section>
      </main>
      {toast}
    </>
  );
}
