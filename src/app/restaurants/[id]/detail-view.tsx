"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast } from "@/components/app/hooks";
import { NotFound } from "@/components/app/NotFound";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MapPreview } from "@/components/ui/MapPreview";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { TopNavigation } from "@/components/ui/Navigation";
import { Modal } from "@/components/ui/Overlay";
import { PhotoActions, PhotoSlider } from "@/components/ui/PhotoSlider";
import { formatDate } from "@/lib/format";
import { actions, findUser, useAppState } from "@/lib/store";

export function DetailView({ id }: { id: string }) {
  const router = useRouter();
  const back = useBack();
  const state = useAppState();
  const { show, toast } = useFlashToast();
  const { busy, run } = useBusy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const r = state.restaurants.find((x) => x.id === id);

  // 다른 기기·탭에서 지워졌거나 목록에 없는 글도 서버 기준으로 맞춘다. 네트워크 오류면 이미 가진 내용을 유지한다.
  useEffect(() => { void actions.loadRestaurant(id).catch(() => undefined); }, [id]);

  if (!r) return <NotFound title="없는 글입니다" description="삭제되었거나 주소가 잘못된 글이에요" />;

  const author = findUser(state, r.authorId);
  const isOwner = state.loggedIn && r.authorId === state.me.id;
  const edit = () => router.push(`/restaurants/${r.id}/edit`);
  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      show({ variant: "success", message });
    } catch {
      show({ variant: "error", message: "복사하지 못했어요. 다시 시도해 주세요." });
    }
  };

  return (
    <main className="mx-auto w-full max-w-page flex-1 lg:grid lg:grid-cols-2 lg:items-start lg:gap-(--spacing-32) lg:px-(--spacing-20) lg:py-(--spacing-24)">
      <PhotoSlider photos={r.photos} alt={r.name} className="h-[290px] md:h-[420px] lg:sticky lg:top-(--spacing-24) lg:h-[520px] lg:rounded-xl">
        <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenuOpen(false)}>
          <TopNavigation title={r.name} onBack={back} onMore={() => setMenuOpen((o) => !o)} />
          {menuOpen && (
            <Menu className="absolute top-full right-0 z-20">
              <MenuItem size="sm" icon="share" onClick={() => copy(window.location.href, "링크를 복사했어요")}>
                링크 복사
              </MenuItem>
              {isOwner && (
                <>
                  <MenuItem size="sm" icon="edit" onClick={edit}>
                    수정하기
                  </MenuItem>
                  <MenuItem size="sm" icon="delete" variant="destructive" onClick={() => setConfirmDelete(true)}>
                    삭제하기
                  </MenuItem>
                </>
              )}
            </Menu>
          )}
        </div>
        {isOwner && <PhotoActions onEdit={edit} onDelete={() => setConfirmDelete(true)} />}
      </PhotoSlider>

      <div>
        <section className="flex flex-col gap-(--spacing-16) px-(--spacing-20) pt-(--spacing-20) pb-(--spacing-24) lg:pt-0">
          <div className="flex flex-col gap-(--spacing-12)">
            <h1 className="heading-lg text-text-default">{r.name}</h1>
            <Link href={`/users/${r.authorId}`} className="flex items-center gap-(--spacing-8) self-start">
              <Avatar src={author?.avatarUrl} />
              <span className="label-lg text-text-default">{author?.nickname ?? "알 수 없음"}</span>
              <span className="label-md text-text-tertiary">{formatDate(r.createdAt)} 작성</span>
            </Link>
          </div>
          <p className="body-lg whitespace-pre-line text-text-content">{r.content}</p>
        </section>

        <div className="h-2 bg-background-subtle lg:rounded-sm" />

        <section className="flex flex-col gap-(--spacing-12) px-(--spacing-20) py-(--spacing-24)">
          <h2 className="heading-sm text-text-default">위치</h2>
          <div className="flex items-center gap-(--spacing-8)">
            <Icon name="home" size={16} className="text-icon-brand" />
            <p className="label-lg flex-1 text-text-default">{r.address}</p>
            <button
              type="button"
              onClick={() => copy(r.address, "주소를 복사했어요")}
              className="flex h-[30px] shrink-0 cursor-pointer items-center gap-(--spacing-8) rounded-lg border border-border-default px-(--spacing-8)"
            >
              <Icon name="copy" size={16} className="text-icon-secondary" />
              <span className="label-md text-text-secondary">복사</span>
            </button>
          </div>
          <MapPreview address={r.address} className="md:h-[240px]" />
          <Button
            variant="secondary"
            icon="arrow-up"
            className="w-full"
            onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(r.address)}`, "_blank", "noopener")}
          >
            카카오맵으로 길찾기
          </Button>
        </section>
      </div>

      <Modal
        open={confirmDelete}
        title="정말 삭제할까요?"
        description="삭제한 글은 되돌릴 수 없어요."
        confirmLabel="삭제"
        cancelLabel="취소"
        onClose={() => setConfirmDelete(false)}
        busy={busy}
        onConfirm={() => run(async () => {
          try {
            await actions.deleteRestaurant(r.id);
            router.replace("/");
          } catch (error) {
            setConfirmDelete(false);
            show({ variant: "error", message: errorMessage(error, "글을 삭제하지 못했어요.") });
          }
        })}
      />
      {toast}
    </main>
  );
}
