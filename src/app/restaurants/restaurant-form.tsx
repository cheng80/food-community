"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast, useRequireLogin } from "@/components/app/hooks";
import { NotFound, PageLoading } from "@/components/app/NotFound";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Feedback";
import { FileItem, FileUploader } from "@/components/ui/FileUploader";
import { MapPreview } from "@/components/ui/MapPreview";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { TopNavigation } from "@/components/ui/Navigation";
import { BottomSheet } from "@/components/ui/Overlay";
import { Select } from "@/components/ui/Select";
import { SelectItem } from "@/components/ui/SelectItem";
import { Textarea } from "@/components/ui/Textarea";
import { TextField } from "@/components/ui/TextField";
import { addressBook } from "@/lib/data";
import { actions, useAppState } from "@/lib/store";

const MAX_PHOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MIN_CONTENT = 10;

interface Photo {
  key: string;
  name: string;
  url?: string;
  status: "uploading" | "complete" | "error";
}

let photoSeq = 0;

export function RestaurantForm({ editId }: { editId?: string }) {
  const ready = useRequireLogin();
  const { restaurants, me } = useAppState();
  if (!ready) return <PageLoading />;
  if (!editId) return <Form />;
  const target = restaurants.find((r) => r.id === editId);
  if (!target || target.authorId !== me.id) return <NotFound title="수정할 수 없는 글이에요" description="삭제되었거나 내가 쓴 글이 아니에요" />;
  return <Form editId={editId} initial={target} />;
}

function Form({ editId, initial }: { editId?: string; initial?: { name: string; content: string; address: string; photos: string[] } }) {
  const router = useRouter();
  const back = useBack();
  const { show: flash, toast } = useFlashToast();
  const { busy, run } = useBusy();
  const [photos, setPhotos] = useState<Photo[]>(
    () => initial?.photos.map((url, i) => ({ key: `p${photoSeq++}`, name: `사진 ${i + 1}`, url, status: "complete" as const })) ?? [],
  );
  const [photoError, setPhotoError] = useState<string>();
  const [name, setName] = useState(initial?.name ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetQuery, setSheetQuery] = useState("");

  const ready = photos.filter((p) => p.status === "complete");
  const errors = {
    photos: ready.length === 0 ? "사진을 1장 이상 올려 주세요." : undefined,
    name: name.trim() ? undefined : "맛집 이름을 입력해 주세요.",
    content: content.trim().length < MIN_CONTENT ? `내용을 ${MIN_CONTENT}자 이상 적어 주세요.` : undefined,
    address: address ? undefined : "주소 검색으로 정확한 주소를 골라 주세요.",
  };
  const errorCount = Object.values(errors).filter(Boolean).length;
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const addFiles = (files: File[]) => {
    setPhotoError(undefined);
    const room = MAX_PHOTOS - photos.length;
    const valid = files.filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES);
    if (valid.length < files.length) setPhotoError("jpg, png, webp 이미지만 장당 10MB 이하로 올릴 수 있어요.");
    else if (valid.length > room) setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
    for (const file of valid.slice(0, room)) {
      const key = `p${photoSeq++}`;
      setPhotos((list) => [...list, { key, name: file.name, status: "uploading" }]);
      const reader = new FileReader();
      const update = (patch: Partial<Photo>) => setPhotos((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));
      reader.onload = () => update({ url: String(reader.result), status: "complete" });
      reader.onerror = () => update({ status: "error" });
      reader.readAsDataURL(file);
    }
  };

  const submit = () => {
    setSubmitted(true);
    setBannerOpen(true);
    if (errorCount > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const input = { name: name.trim(), content: content.trim(), address, photos: ready.map((p) => p.url!) };
    return run(async () => {
      try {
        if (editId) {
          await actions.updateRestaurant(editId, input);
          router.replace(`/restaurants/${editId}`);
        } else {
          const id = await actions.createRestaurant(input);
          router.replace(`/restaurants/${id}`);
          // 이전 라우트는 숨김 상태로 보존되므로 다음 글쓰기를 위해 비움
          setPhotos([]);
          setName("");
          setContent("");
          setAddress("");
          setSubmitted(false);
        }
      } catch (error) {
        flash({ variant: "error", message: errorMessage(error, "글을 저장하지 못했어요.") });
      }
    });
  };

  const sheetResults = addressBook.filter((a) => a.includes(sheetQuery.trim()));

  return (
    <>
      <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenuOpen(false)}>
        <TopNavigation title={editId ? "맛집 수정" : "맛집 등록"} onBack={back} onMore={() => setMenuOpen((o) => !o)} />
        {menuOpen && (
          <div className="absolute inset-x-0 top-full z-20 mx-auto flex max-w-page justify-end px-(--spacing-16)">
            <Menu>
              <MenuItem size="sm" icon="close" variant="destructive" onClick={back}>
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
              accept={ACCEPT.join(",")}
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
                      onRemove={() => setPhotos((list) => list.filter((x) => x.key !== p.key))}
                    />
                  ))}
                </div>
              )}
            </FileUploader>
            <TextField
              size="lg"
              icon="search"
              label="맛집 이름 *"
              placeholder="식당 이름을 입력하세요"
              value={name}
              maxLength={40}
              errorText={show("name")}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              label="내용 *"
              placeholder="후기, 추천 메뉴, 분위기를 자유롭게 적어 주세요"
              value={content}
              errorText={show("content")}
              counterText={(n) => `${n} / 최소 ${MIN_CONTENT}자`}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-(--spacing-8)">
            <Select
              size="lg"
              label="주소 *"
              placeholder="도로명, 지번으로 검색"
              options={addressBook.map((a) => ({ value: a, label: a }))}
              value={address || undefined}
              errorText={show("address")}
              onChange={setAddress}
            />
            <Button variant="secondary" icon="search" className="w-[170px]" onClick={() => setSheetOpen(true)}>
              주소 검색
            </Button>
            <MapPreview address={address || undefined} className="md:h-[240px]" />
          </div>
        </form>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border-default bg-background-default">
        <div className="mx-auto flex w-full max-w-page justify-end px-(--spacing-20) pt-(--spacing-12) pb-(--spacing-24)">
          <Button type="submit" form="restaurant-form" size="lg" icon={editId ? "check" : "plus"} loading={busy} className="w-full md:w-60">
            {editId ? "수정하기" : "등록하기"}
          </Button>
        </div>
      </div>

      <BottomSheet open={sheetOpen} title="주소 검색" onClose={() => setSheetOpen(false)}>
        <div className="flex w-full flex-col gap-(--spacing-12)">
          <TextField
            label="도로명, 지번"
            icon="search"
            placeholder="예: 광명로, 서신면"
            value={sheetQuery}
            autoFocus
            onChange={(e) => setSheetQuery(e.target.value)}
          />
          <div role="listbox" aria-label="주소 검색 결과" className="flex max-h-[240px] flex-col overflow-y-auto">
            {sheetResults.length > 0 ? (
              sheetResults.map((a) => (
                <SelectItem
                  key={a}
                  selected={a === address}
                  onClick={() => {
                    setAddress(a);
                    setSheetOpen(false);
                  }}
                >
                  {a}
                </SelectItem>
              ))
            ) : (
              <p className="body-md py-(--spacing-12) text-center text-text-secondary">검색 결과가 없어요</p>
            )}
          </div>
        </div>
      </BottomSheet>
      {toast}
    </>
  );
}
