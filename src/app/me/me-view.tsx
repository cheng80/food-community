"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast, useLogout, useRequireLogin } from "@/components/app/hooks";
import { PageLoading } from "@/components/app/NotFound";
import { ProfileSummary } from "@/components/app/ProfileSummary";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/Feedback";
import { TopNavigation } from "@/components/ui/Navigation";
import { Modal } from "@/components/ui/Overlay";
import { PostRow } from "@/components/ui/PostRow";
import { TextField } from "@/components/ui/TextField";
import { nicknameError, shortAddress, timeAgo } from "@/lib/format";
import { actions, useAppState, useNow } from "@/lib/store";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX = 5 * 1024 * 1024;

export function MeView() {
  const ready = useRequireLogin();
  const router = useRouter();
  const back = useBack();
  const logout = useLogout();
  const { me, restaurants } = useAppState();
  const now = useNow();
  const { show, toast } = useFlashToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState<string>();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const { busy, run } = useBusy();
  const deleting = useBusy();

  if (!ready) return <PageLoading />;

  const mine = restaurants.filter((r) => r.authorId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  const draftName = nickname ?? me.nickname;
  const error = touched ? nicknameError(draftName) : undefined;
  const target = mine.find((r) => r.id === deleteId);

  const pickAvatar = (file?: File) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type) || file.size > AVATAR_MAX) {
      show({ variant: "error", message: "jpg, png, webp 이미지만 5MB 이하로 올릴 수 있어요." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    setTouched(true);
    if (nicknameError(draftName)) return;
    return run(async () => {
      try {
        await actions.updateProfile({ nickname: draftName.trim() });
        setNickname(undefined);
        setAvatarUrl(undefined);
        setTouched(false);
        show({ variant: "success", message: "프로필을 저장했어요" });
      } catch (error) {
        show({ variant: "error", message: errorMessage(error, "프로필을 저장하지 못했어요.") });
      }
    });
  };

  return (
    <>
      <TopNavigation
        title="마이 페이지"
        onBack={back}
        moreIcon="logout"
        moreLabel="로그아웃"
        onMore={logout}
      />
      <main className="mx-auto w-full max-w-page flex-1 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-x-(--spacing-32) md:px-(--spacing-20)">
        <div>
          <ProfileSummary user={{ ...me, avatarUrl: avatarUrl ?? me.avatarUrl }} count={mine.length} />
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="flex flex-col gap-(--spacing-16) px-(--spacing-20) pb-(--spacing-24)"
          >
            <h2 className="heading-sm text-text-default">프로필 설정</h2>
            <Button variant="secondary" size="sm" icon="image" className="w-full" onClick={() => fileRef.current?.click()}>
              프로필 사진 변경
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_TYPES.join(",")}
              aria-label="프로필 사진 파일"
              className="sr-only"
              onChange={(e) => {
                pickAvatar(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <TextField
              size="lg"
              icon="user"
              label="닉네임"
              value={draftName}
              maxLength={20}
              helperText="2~12자, 공백만으로는 만들 수 없어요"
              errorText={error}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            <Button type="submit" size="lg" icon="check" loading={busy} className="w-full">
              프로필 저장
            </Button>
          </form>
        </div>

        <div className="h-2 bg-background-subtle md:hidden" />

        <section className="flex flex-col gap-(--spacing-12) px-(--spacing-20) pt-(--spacing-24) pb-(--spacing-32)">
          <div className="flex items-center gap-(--spacing-8)">
            <h2 className="heading-sm text-text-default">내가 쓴 글</h2>
            <Badge>{String(mine.length)}</Badge>
          </div>
          {mine.length > 0 ? (
            <div className="flex flex-col">
              {mine.map((r) => (
                <PostRow
                  key={r.id}
                  title={r.name}
                  meta={`${shortAddress(r.address)} · ${timeAgo(r.createdAt, now)}`}
                  href={`/restaurants/${r.id}`}
                  thumbnailUrl={r.photos[0]}
                  onEdit={() => router.push(`/restaurants/${r.id}/edit`)}
                  onDelete={() => setDeleteId(r.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-(--spacing-24)">
              <Empty
                title="아직 쓴 글이 없어요"
                description="다녀온 맛집을 이웃에게 알려 주세요"
                primaryLabel="맛집 올리기"
                onPrimary={() => router.push("/restaurants/new")}
              />
            </div>
          )}
        </section>
      </main>

      <Modal
        open={!!target}
        title="정말 삭제할까요?"
        description={`‘${target?.name ?? ""}’ 글을 삭제하면 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        busy={deleting.busy}
        onClose={() => setDeleteId(undefined)}
        onConfirm={() => deleting.run(async () => {
          if (!target) return;
          try {
            await actions.deleteRestaurant(target.id);
            show({ variant: "success", message: "글을 삭제했어요" });
          } catch (error) {
            show({ variant: "error", message: errorMessage(error, "글을 삭제하지 못했어요.") });
          }
          setDeleteId(undefined);
        })}
      />
      {toast}
    </>
  );
}
