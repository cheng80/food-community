"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast, useRequireLogin } from "@/components/app/hooks";
import { NotFound, PageLoading } from "@/components/app/NotFound";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Feedback";
import { FileItem, FileUploader } from "@/components/ui/FileUploader";
import { NaverMap } from "@/components/app/NaverMap";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { TopNavigation } from "@/components/ui/Navigation";
import { Textarea } from "@/components/ui/Textarea";
import { PlaceSummary } from "@/components/ui/Place";
import { TextField } from "@/components/ui/TextField";
import type { Restaurant } from "@/lib/data";
import { actions, useAppState, type RestaurantInput } from "@/lib/store";
import { clearDraft, getDraft, updateDraft, useDraft, type DraftPhoto } from "@/lib/form-draft";
import { commitDrafts, discardImage, uploadImage } from "@/lib/upload";
import { IMAGE_TYPES, MAX_BYTES, MAX_PHOTOS, MAX_TITLE, MIN_CONTENT, restaurantErrors } from "@/lib/validation";

let photoSeq = 0;

export function RestaurantForm({ editId }: { editId?: string }) {
  const ready = useRequireLogin();
  const { restaurants, me } = useAppState();
  // 다른 탭에서 지운 글은 수정 화면에 들어오지 못하게 서버 기준으로 맞춘다.
  useEffect(() => { if (editId) void actions.loadRestaurant(editId).catch(() => undefined); }, [editId]);
  if (!ready) return <PageLoading />;
  if (!editId) return <Form />;
  const target = restaurants.find((r) => r.id === editId);
  if (!target || target.authorId !== me.id) return <NotFound title="수정할 수 없는 글이에요" description="삭제되었거나 내가 쓴 글이 아니에요" />;
  return <Form editId={editId} initial={target} />;
}

function Form({ editId, initial }: { editId?: string; initial?: Restaurant }) {
  const router = useRouter();
  const back = useBack();
  const { show: flash, toast } = useFlashToast();
  const { busy, run } = useBusy();
  // 장소 선택 페이지를 다녀와도 입력과 사진을 유지하도록 페이지 밖 저장소에 둔다.
  const draftKey = editId ?? "new";
  const { title, content, place, photos } = useDraft(draftKey, () => ({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    address: initial?.address ?? "",
    // 좌표 도입 전 글은 위치를 추정하지 않고 다시 고르게 한다.
    place: initial?.placeName && initial.lat !== null && initial.lng !== null ? { name: initial.placeName, address: initial.address, lat: initial.lat, lng: initial.lng } : null,
    photos: initial?.photos.map((url, i) => ({ key: `p${photoSeq++}`, name: `사진 ${i + 1}`, url, path: initial.photoPaths[i], draft: false, status: "complete" as const })) ?? [],
  }));
  const [photoError, setPhotoError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const ready = photos.filter((p) => p.status === "complete");
  const uploading = photos.some((p) => p.status === "uploading");
  const errors = {
    photos: ready.length === 0 ? "사진을 1장 이상 올려 주세요." : undefined,
    ...restaurantErrors({ title, content, placeName: place?.name, address: place?.address, lat: place?.lat, lng: place?.lng }),
  };
  const errorCount = Object.values(errors).filter(Boolean).length;
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const addFiles = (files: File[]) => {
    setPhotoError(undefined);
    const room = MAX_PHOTOS - photos.length;
    const valid = files.filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= MAX_BYTES["place-image"]);
    if (valid.length < files.length) setPhotoError("jpg, png, webp 이미지만 장당 10MB 이하로 올릴 수 있어요.");
    else if (valid.length > room) setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
    for (const file of valid.slice(0, room)) {
      const key = `p${photoSeq++}`;
      updateDraft(draftKey, (d) => ({ photos: [...d.photos, { key, name: file.name, draft: true, status: "uploading" }] }));
      const update = (patch: Partial<DraftPhoto>) => updateDraft(draftKey, (d) => ({ photos: d.photos.map((p) => (p.key === key ? { ...p, ...patch } : p)) }));
      uploadImage(file, "place-image").then(
        ({ path, url }) => {
          // 업로드 중에 지운 사진이나 저장·취소가 끝난 글의 사진은 남기지 않는다.
          if (getDraft(draftKey)?.photos.some((p) => p.key === key)) update({ path, url, status: "complete" });
          else discardImage("place-image", path);
        },
        (error) => {
          update({ status: "error" });
          setPhotoError(errorMessage(error, "사진을 올리지 못했어요."));
        },
      );
    }
  };

  const removePhoto = (photo: DraftPhoto) => {
    updateDraft(draftKey, (d) => ({ photos: d.photos.filter((p) => p.key !== photo.key) }));
    if (photo.draft && photo.path) discardImage("place-image", photo.path);
  };

  const openPlace = () => router.push(`/restaurants/place?for=${draftKey}`);

  /** 작성 취소: 저장하지 않은 이미지는 지우고 돌아간다. */
  const cancel = () => {
    photos.filter((p) => p.draft).forEach(removePhoto);
    clearDraft(draftKey);
    back();
  };

  const submit = () => {
    setSubmitted(true);
    setBannerOpen(true);
    if (errorCount > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (uploading) {
      setPhotoError("사진 업로드가 끝나면 저장할 수 있어요.");
      return;
    }
    const imagePaths = ready.map((p) => p.path!);
    if (!place) return;
    const input: RestaurantInput = { title: title.trim(), content: content.trim(), placeName: place.name, address: place.address, lat: place.lat, lng: place.lng, imagePaths };
    return run(async () => {
      try {
        if (editId) {
          await actions.updateRestaurant(editId, input);
          commitDrafts(imagePaths);
          router.replace(`/restaurants/${editId}`);
          clearDraft(draftKey);
        } else {
          const id = await actions.createRestaurant(input);
          commitDrafts(imagePaths);
          router.replace(`/restaurants/${id}`);
          clearDraft(draftKey);
          setSubmitted(false);
        }
      } catch (error) {
        flash({ variant: "error", message: errorMessage(error, "글을 저장하지 못했어요.") });
      }
    });
  };

  return (
    <>
      <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenuOpen(false)}>
        <TopNavigation title={editId ? "맛집 수정" : "맛집 등록"} onBack={back} onMore={() => setMenuOpen((o) => !o)} />
        {menuOpen && (
          <div className="absolute inset-x-0 top-full z-20 mx-auto flex max-w-page justify-end px-(--spacing-16)">
            <Menu>
              <MenuItem size="sm" icon="close" variant="destructive" onClick={cancel}>
                작성 취소
              </MenuItem>
            </Menu>
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-page flex-1">
        {submitted && bannerOpen && errorCount > 0 && (
          <div className="px-(--spacing-20) pt-(--spacing-16)">
            <Toast
              variant="error"
              message={`필수 항목 ${errorCount}개를 확인해 주세요\n빨간색으로 표시된 항목을 채우면 등록할 수 있어요.`}
              onClose={() => setBannerOpen(false)}
            />
          </div>
        )}

        <form
          id="restaurant-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="grid grid-cols-1 gap-(--spacing-24) px-(--spacing-20) pt-(--spacing-24) pb-(--spacing-32) md:grid-cols-2 md:gap-x-(--spacing-32)"
        >
          <div className="flex flex-col gap-(--spacing-24)">
            <FileUploader
              label={`사진 * ${photos.length} / ${MAX_PHOTOS}`}
              helperText="최대 5장 · 장당 10MB 이하 · jpg, png, webp"
              dropzoneText="사진 추가"
              accept={IMAGE_TYPES.join(",")}
              disabled={photos.length >= MAX_PHOTOS}
              errorText={photoError ?? show("photos")}
              onFiles={addFiles}
            >
              {photos.length > 0 && (
                <div className="flex flex-col">
                  {photos.map((p) => (
                    <FileItem
                      key={p.key}
                      name={p.name}
                      status={p.status}
                      thumbnailUrl={p.url}
                      onRemove={() => removePhoto(p)}
                    />
                  ))}
                </div>
              )}
            </FileUploader>
            <TextField
              size="lg"
              label="글 제목 *"
              placeholder="이 글의 제목을 입력하세요"
              helperText="장소 이름과 별개예요. 최대 40자"
              value={title}
              maxLength={MAX_TITLE}
              errorText={show("title")}
              onChange={(e) => updateDraft(draftKey, { title: e.target.value })}
            />
            <Textarea
              label="내용 *"
              placeholder="후기, 추천 메뉴, 분위기를 자유롭게 적어 주세요"
              value={content}
              errorText={show("content")}
              counterText={(n) => `${n} / 최소 ${MIN_CONTENT}자`}
              onChange={(e) => updateDraft(draftKey, { content: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-(--spacing-8)">
            <span className="label-lg text-text-default">장소 *</span>
            <Button variant="secondary" size="lg" icon={place ? "edit" : "plus"} className="w-full" onClick={openPlace}>
              {place ? "장소 다시 선택" : "장소 입력"}
            </Button>
            {show("place") && <span className="label-md text-text-error">{show("place")}</span>}
            {place ? (
              <>
                <PlaceSummary name={place.name} address={place.address} onChange={openPlace} />
                <NaverMap key={`${place.lat},${place.lng}`} center={place} marker className="h-[140px] rounded-xl md:h-[240px]" />
              </>
            ) : initial ? (
              <p className="body-md text-text-secondary">{initial.address} · 지도 위치가 없어 다시 골라야 저장돼요</p>
            ) : null}
          </div>
        </form>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border-default bg-background-default">
        <div className="mx-auto flex w-full max-w-page justify-end px-(--spacing-20) pt-(--spacing-12) pb-(--spacing-24)">
          <Button type="submit" form="restaurant-form" size="lg" icon={editId ? "check" : "plus"} loading={busy} disabled={uploading} className="w-full md:w-60">
            {editId ? "수정하기" : "등록하기"}
          </Button>
        </div>
      </div>

      {toast}
    </>
  );
}
