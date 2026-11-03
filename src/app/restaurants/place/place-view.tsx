"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, useBack, useRequireLogin } from "@/components/app/hooks";
import { NaverMap, type LatLngValue } from "@/components/app/NaverMap";
import { PageLoading } from "@/components/app/NotFound";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { TopNavigation } from "@/components/ui/Navigation";
import { AddressBox, PlaceResultItem } from "@/components/ui/Place";
import { TextField } from "@/components/ui/TextField";
import { request } from "@/lib/api";
import { cx } from "@/lib/cx";
import { getDraft, updateDraft } from "@/lib/form-draft";
import type { PlaceResult } from "@/lib/naver-normalize";
import { DEFAULT_CENTER } from "@/lib/naver-map";
import { createReverseLookup, type ReverseState } from "@/lib/reverse-lookup";
import { useIsDesktop } from "@/lib/use-desktop";
import { isUuid } from "@/lib/validation";

const fetchAddress = (lat: number, lng: number, signal: AbortSignal) =>
  request<{ address: string | null }>("/api/naver/reverse", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  }).then((body) => body.address);

export function PlaceView() {
  const ready = useRequireLogin();
  const router = useRouter();
  const key = useSearchParams().get("for") ?? "new";
  const formPath = isUuid(key) ? `/restaurants/${key}/edit` : "/restaurants/new";
  const back = useBack(formPath);
  const isDesktop = useIsDesktop();
  const saved = getDraft(key)?.place;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [showMap, setShowMap] = useState(false);
  const [center, setCenter] = useState<LatLngValue>(saved ?? DEFAULT_CENTER);
  const [name, setName] = useState(saved?.name ?? "");
  const [reverse, setReverse] = useState<ReverseState>(saved ? { status: "ok", address: saved.address, lat: saved.lat, lng: saved.lng } : { status: "idle" });
  const searchControl = useRef<AbortController>(null);
  const lookup = useMemo(() => createReverseLookup(fetchAddress, setReverse, saved ? { address: saved.address, lat: saved.lat, lng: saved.lng } : undefined), [saved]);

  // 새로고침으로 폼 저장소가 비면 저장할 곳이 없으므로 폼으로 돌려보낸다.
  useEffect(() => { if (ready && !getDraft(key)) router.replace(formPath); }, [ready, key, formPath, router]);
  useEffect(() => () => { searchControl.current?.abort(); lookup.dispose(); }, [lookup]);

  if (!ready) return <PageLoading />;

  const search = async () => {
    const text = query.trim();
    if (!text) return;
    searchControl.current?.abort();
    const control = new AbortController();
    searchControl.current = control;
    setSearching(true);
    setSearchError(undefined);
    try {
      const body = await request<{ results: PlaceResult[] }>("/api/naver/search", {
        method: "POST",
        signal: control.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!control.signal.aborted) setResults(body.results);
    } catch (error) {
      if (!control.signal.aborted) { setResults(null); setSearchError(errorMessage(error, "검색하지 못했어요.")); }
    } finally {
      if (!control.signal.aborted) setSearching(false);
    }
  };

  const choose = (result: PlaceResult) => {
    setName(result.name);
    lookup.select(result);
    setCenter({ lat: result.lat, lng: result.lng });
    setShowMap(true);
  };

  // 결과 없음의 직접 입력은 현재 중심을 유지하고 그 자리의 주소를 찾는다.
  const pickOnMap = () => {
    setName("");
    lookup.clear();
    setShowMap(true);
  };

  const canRegister = reverse.status === "ok" && !!name.trim();
  const register = () => {
    if (reverse.status !== "ok" || !name.trim()) return;
    updateDraft(key, { place: { name: name.trim(), address: reverse.address, lat: reverse.lat, lng: reverse.lng }, address: reverse.address });
    back();
  };

  const mapVisible = isDesktop || showMap;
  return (
    <>
      <TopNavigation title="장소 등록" onBack={showMap && !isDesktop ? () => setShowMap(false) : back} moreIcon="home" moreLabel="폼으로 돌아가기" onMore={back} />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-(--spacing-16) px-(--spacing-20) pt-(--spacing-8) pb-(--spacing-24) lg:flex-row lg:gap-(--spacing-32)">
        <div className={cx("flex flex-col gap-(--spacing-12) lg:w-[420px] lg:shrink-0", showMap && !isDesktop && "hidden")}>
          <form noValidate onSubmit={(e) => { e.preventDefault(); void search(); }} className="flex items-end gap-(--spacing-8)">
            <TextField label="장소 검색" size="lg" icon="search" type="search" placeholder="장소 이름이나 주소로 검색" value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
            <Button type="submit" size="lg" loading={searching}>검색</Button>
          </form>
          {searchError && <p role="alert" className="label-md text-text-error">{searchError}</p>}
          {results && results.length > 0 && (
            <div className="flex flex-col">
              {results.map((result) => <PlaceResultItem key={`${result.lat},${result.lng},${result.name}`} name={result.name} address={result.address} onClick={() => choose(result)} />)}
            </div>
          )}
          {results?.length === 0 ? (
            <div className="flex justify-center py-(--spacing-24)">
              <Empty title="검색 결과가 없어요" description="지도에서 위치를 고르고 장소명을 직접 입력해 주세요" primaryLabel="지도에서 직접 입력" onPrimary={pickOnMap} />
            </div>
          ) : (
            <Button variant="secondary" icon="map-pin" className="w-full" onClick={pickOnMap}>
              {results ? "찾는 곳이 없어요. 직접 입력" : "지도에서 직접 고르기"}
            </Button>
          )}
        </div>
        {mapVisible && (
          <div className="flex min-w-0 flex-1 flex-col gap-(--spacing-12)">
            <NaverMap center={center} centerPin onCenterChange={lookup.moved} onIdle={lookup.settled} className="h-[380px] rounded-xl lg:h-[520px]" />
            <TextField label="장소명 *" size="lg" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            <AddressBox status={reverse.status === "ok" ? "default" : reverse.status === "empty" || reverse.status === "error" ? "error" : "loading"}>
              {reverse.status === "ok" ? reverse.address : reverse.status === "empty" ? "주소를 찾을 수 없는 위치예요" : reverse.status === "error" ? reverse.message : "주소를 확인하는 중이에요"}
            </AddressBox>
            <Button size="lg" className="w-full" disabled={!canRegister} onClick={register}>이 위치로 등록</Button>
          </div>
        )}
      </main>
    </>
  );
}
