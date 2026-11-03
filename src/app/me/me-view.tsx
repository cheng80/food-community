"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast, useLogout, useRequireLogin } from "@/components/app/hooks";
import { PageLoading } from "@/components/app/NotFound";
import { ProfileSummary } from "@/components/app/ProfileSummary";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { TabNavigation, TopNavigation } from "@/components/ui/Navigation";
import { Modal } from "@/components/ui/Overlay";
import { PaymentHistoryItem, SampleNotice } from "@/components/ui/Payment";
import { PostRow } from "@/components/ui/PostRow";
import { TextField } from "@/components/ui/TextField";
import { nicknameError, shortAddress, timeAgo } from "@/lib/format";
import { findProgram, formatPrice, sampleActions, usePaymentSample, type Application } from "@/lib/payment-sample";
import { actions, useAppState, useNow } from "@/lib/store";
import { IMAGE_TYPES, imageError } from "@/lib/validation";

const tabs = [
  { key: "payments", label: "결제 내역" },
  { key: "cancels", label: "취소 내역" },
  { key: "posts", label: "내가 쓴 글" },
];

/** design.pen 19~22 마이 · 25 데스크톱. 탭과 프로필 설정은 URL(?tab=, ?profile=edit)로 바로 열린다. */
export function MeView() {
  const ready = useRequireLogin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const back = useBack();
  const logout = useLogout();
  const { me, restaurants } = useAppState();
  const apps = usePaymentSample();
  const now = useNow();
  const { show, toast } = useFlashToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState<string>();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const [cancelId, setCancelId] = useState<string>();
  const { busy, run } = useBusy();
  const deleting = useBusy();

  if (!ready) return <PageLoading />;

  const tab = tabs.some((t) => t.key === params.get("tab")) ? params.get("tab")! : "payments";
  const editing = params.get("profile") === "edit";
  const go = (next: { tab?: string; editing?: boolean }) => {
    const query = new URLSearchParams({ tab: next.tab ?? tab });
    if (next.editing ?? editing) query.set("profile", "edit");
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  const mine = restaurants.filter((r) => r.authorId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  const draftName = nickname ?? me.nickname;
  const error = touched ? nicknameError(draftName) : undefined;
  const target = mine.find((r) => r.id === deleteId);
  const cancelling = apps.find((a) => a.id === cancelId);
  const cancelTitle = cancelling && findProgram(cancelling.programId)?.title;
  const paid = apps.filter((a) => a.status === "paid");
  const cancelled = apps.filter((a) => a.status !== "paid");

  // 샘플이라 업로드하지 않고 이 브라우저에서만 미리 보여 준다.
  const pickAvatar = (file?: File) => {
    if (!file) return;
    const invalid = imageError(file.type, file.size, "profile-image");
    if (invalid) show({ variant: "error", message: invalid });
    else setAvatarUrl(URL.createObjectURL(file));
  };

  const save = () => {
    setTouched(true);
    if (nicknameError(draftName)) return;
    return run(async () => {
      await actions.updateProfile({ nickname: draftName.trim(), avatarUrl });
      setNickname(undefined);
      setAvatarUrl(undefined);
      setTouched(false);
      show({ variant: "success", message: "이 브라우저에서만 프로필을 바꿨어요 (샘플)" });
    });
  };

  const row = (a: Application) => {
    const program = findProgram(a.programId);
    if (!program) return null;
    return (
      <PaymentHistoryItem
        key={a.id}
        href={`/programs/${program.id}`}
        title={program.title}
        amount={formatPrice(program.price)}
        status={a.status}
        meta={a.status === "paid" ? `${program.dateShort} · ${a.method}` : a.status === "cancelled" ? `${a.cancelledOn} 취소 · 환불 완료 표시(샘플)` : "운영자 확인이 필요한 상태 예시"}
        onCancel={a.status === "paid" ? () => setCancelId(a.id) : undefined}
      />
    );
  };

  return (
    <>
      <TopNavigation title="마이 페이지" onBack={back} moreIcon="logout" moreLabel="로그아웃" onMore={logout} />
      <main className="mx-auto w-full max-w-page flex-1 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-x-(--spacing-32) md:px-(--spacing-20)">
        <div>
          <ProfileSummary user={{ ...me, avatarUrl: avatarUrl ?? me.avatarUrl }} count={mine.length} />
          <div className="px-(--spacing-20) pb-(--spacing-16)">
            <Button variant="secondary" size="sm" icon="settings" className="w-full" aria-expanded={editing} onClick={() => go({ editing: !editing })}>
              {editing ? "프로필 설정 닫기" : "프로필 설정"}
            </Button>
          </div>
          {editing && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              className="flex flex-col gap-(--spacing-16) px-(--spacing-20) pb-(--spacing-24)"
            >
              <h2 className="heading-sm text-text-default">프로필 설정</h2>
              <Button variant="secondary" size="sm" icon="image" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
                프로필 사진 변경
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
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
          )}
        </div>

        <div className="h-2 bg-background-subtle md:hidden" />

        <section>
          <TabNavigation tabs={tabs} activeKey={tab} onChange={(key) => go({ tab: key })} className="border-b border-border-default" />
          <div role="tabpanel" aria-label={tabs.find((t) => t.key === tab)?.label} className="flex flex-col gap-(--spacing-12) px-(--spacing-20) pt-(--spacing-16) pb-(--spacing-32) md:px-0">
            {tab !== "posts" && <SampleNotice />}
            {tab === "payments" &&
              (paid.length > 0 ? <div className="flex flex-col">{paid.map(row)}</div> : <div className="flex justify-center py-(--spacing-24)"><Empty title="샘플 결제 내역이 없어요" description="배너에서 요리 수업을 살펴보세요" primaryLabel="요리 수업 보기" onPrimary={() => router.push("/programs/sushi-bento")} /></div>)}
            {tab === "cancels" &&
              (cancelled.length > 0 ? <div className="flex flex-col">{cancelled.map(row)}</div> : <div className="flex justify-center py-(--spacing-24)"><Empty title="취소 내역이 없어요" description="샘플 취소를 하면 여기에 보여요" /></div>)}
            {tab === "posts" &&
              (mine.length > 0 ? (
                <div className="flex flex-col">
                  {mine.map((r) => (
                    <PostRow
                      key={r.id}
                      title={r.title}
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
              ))}
          </div>
        </section>
      </main>

      <Modal
        open={!!cancelling}
        title="샘플 취소할까요?"
        description={`‘${cancelTitle ?? ""}’ 샘플 신청을 취소해요. 실제 환불은 일어나지 않아요.`}
        confirmLabel="샘플 취소"
        cancelLabel="닫기"
        onClose={() => setCancelId(undefined)}
        onConfirm={() => {
          if (cancelId) sampleActions.cancel(cancelId);
          setCancelId(undefined);
          go({ tab: "cancels" });
          show({ variant: "success", message: "샘플 신청을 취소했어요" });
        }}
      />
      <Modal
        open={!!target}
        title="정말 삭제할까요?"
        description={`‘${target?.title ?? ""}’ 글을 삭제하면 되돌릴 수 없어요.`}
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
