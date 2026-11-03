"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage, useBack, useBusy, useFlashToast } from "@/components/app/hooks";
import { Badge } from "@/components/ui/Feedback";
import { GoogleLoginButton } from "@/components/ui/GoogleLoginButton";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/lib/cx";
import { photos } from "@/lib/data";
import { safeNext } from "@/lib/format";
import { actions } from "@/lib/store";

/** className에 display(flex/hidden)와 그리드 배치를 지정 */
function Tile({ src, label, className = "flex" }: { src: string; label: string; className?: string }) {
  return (
    <div className={cx("relative flex-col justify-end overflow-hidden rounded-[10px] p-(--spacing-8)", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- design.pen 외부 이미지 */}
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <Badge className="relative self-start">{label}</Badge>
    </div>
  );
}

export function LoginView() {
  const back = useBack();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [redirecting, setRedirecting] = useState(false);
  const { busy, run } = useBusy();
  const { show, toast } = useFlashToast();
  const oauthError = params.has("error");

  // 구글 화면에서 뒤로 왔을 때 bfcache로 복원돼도 버튼을 다시 쓸 수 있게
  useEffect(() => {
    const reset = () => setRedirecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background-default">
      <div className="flex flex-1 flex-col bg-[linear-gradient(to_bottom,var(--color-alpha-black-0)_63%,var(--color-background-overlay-strong)_74%,var(--color-background-inverse)_88%)]">
        <div className="mx-auto flex w-full max-w-page flex-1 flex-col">
          <div className="flex h-14 items-center px-(--spacing-8)">
            <IconButton icon="close" label="닫기" onClick={back} />
          </div>

          <main className="flex flex-1 flex-col">
            <div className="flex flex-col gap-(--spacing-12) px-(--spacing-20) pt-(--spacing-8) pb-(--spacing-24)">
              <p className="label-lg text-text-brand">숨은맛집</p>
              <h1 className="heading-lg whitespace-pre-line text-text-default">{"이웃이 다녀온\n진짜 맛집만 모았어요"}</h1>
              <p className="body-md whitespace-pre-line text-text-secondary">{"구로에서 차로 1시간, 광고 없는 후기로\n이번 주말 갈 곳을 찾아보세요."}</p>
            </div>

            <div className="grid h-[252px] grid-cols-2 grid-rows-2 gap-(--spacing-8) px-(--spacing-20) md:h-[360px] md:grid-cols-3 lg:h-[420px]">
              <Tile src={photos.kalguksu} label="광명 · 손칼국수" className="row-span-2 flex" />
              <Tile src={photos.pajeon} label="안산 · 해물파전" />
              <Tile src={photos.baekban} label="화성 · 백반" />
              <Tile src={photos.dakgalbi} label="부천 · 닭갈비" className="hidden md:col-start-3 md:row-span-2 md:row-start-1 md:flex" />
            </div>

            <div className="min-h-(--spacing-32) flex-1" />

            <div className="flex flex-col items-center gap-(--spacing-12) px-(--spacing-20) pb-(--spacing-32)">
              <p className="label-md rounded-xl border border-border-default bg-background-default px-(--spacing-12) py-(--spacing-8) text-text-brand">
                구글 계정으로 시작해요
              </p>
              <GoogleLoginButton
                disabled={busy || redirecting}
                onClick={() => run(async () => {
                  try { await actions.login(next); setRedirecting(true); }
                  catch (error) { show({ variant: "error", message: errorMessage(error, "로그인에 실패했어요.") }); }
                })}
              />
              {oauthError && <p role="alert" className="body-md text-text-on-image">로그인을 완료하지 못했어요. 다시 시도해 주세요.</p>}
              <Link href="/" className="label-lg text-text-on-image">
                로그인 없이 둘러보기
              </Link>
            </div>
          </main>
        </div>
      </div>
      {toast}
    </div>
  );
}
