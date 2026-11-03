"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { RestaurantGrid } from "@/components/app/RestaurantCard";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Icon } from "@/components/ui/Icon";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { TopNavigation } from "@/components/ui/Navigation";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { useAppState } from "@/lib/store";

const PAGE = 10;
const sorts = { latest: "최신순", name: "이름순" } as const;
type Sort = keyof typeof sorts;

export function HomeView() {
  const router = useRouter();
  const { restaurants } = useAppState();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = q ? restaurants.filter((r) => [r.title, r.placeName ?? "", r.address, r.content].some((v) => v.toLowerCase().includes(q))) : restaurants;
    return [...hits].sort((a, b) => (sort === "name" ? a.title.localeCompare(b.title, "ko") : b.createdAt - a.createdAt));
  }, [restaurants, query, sort]);
  const hasMore = visible < results.length;

  // 무한 스크롤 — 하단 로딩 영역이 보이면 다음 PAGE개
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) timer = setTimeout(() => setVisible((v) => v + PAGE), 500);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [hasMore, visible]);

  const resetPaging = () => setVisible(PAGE);

  return (
    <>
      <TopNavigation
        title="숨은맛집"
        backIcon="home"
        backLabel="홈"
        moreIcon="user"
        moreLabel="내 정보"
        onBack={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onMore={() => router.push("/me")}
        className="sticky top-0 z-30"
      />
      <main className="mx-auto w-full max-w-page flex-1 pb-20">
        <div className="px-(--spacing-20) py-(--spacing-8)">
          <TextField
            type="search"
            label="검색"
            icon="search"
            placeholder="맛집 제목, 장소, 주소, 내용으로 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPaging();
            }}
            className="md:max-w-[480px]"
          />
        </div>

        <div className="flex items-end justify-between gap-(--spacing-16) px-(--spacing-20) pt-(--spacing-20) pb-(--spacing-8)">
          <div className="flex flex-col gap-(--spacing-8)">
            <p className="label-lg text-text-brand">구로에서 차로 1시간, 이웃이 찾은 곳</p>
            <h2 className="heading-md text-text-default">{query.trim() ? `‘${query.trim()}’ 검색 결과` : "이번 주말엔 여기 어때요?"}</h2>
          </div>
          <div className="relative pb-(--spacing-8)" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setSortOpen(false)}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((o) => !o)}
              className="label-lg flex shrink-0 cursor-pointer items-center gap-(--spacing-8) text-text-secondary"
            >
              {sorts[sort]}
              <Icon name="chevron-down" size={16} className="text-icon-secondary" />
            </button>
            {sortOpen && (
              <Menu className="absolute top-full right-0 z-20">
                {(Object.keys(sorts) as Sort[]).map((key) => (
                  <MenuItem
                    key={key}
                    size="sm"
                    icon={key === sort ? "check" : "sort"}
                    onClick={() => {
                      setSort(key);
                      setSortOpen(false);
                      resetPaging();
                    }}
                  >
                    {sorts[key]}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </div>
        </div>

        <div className="px-(--spacing-20)">
          {results.length > 0 ? (
            <RestaurantGrid restaurants={results.slice(0, visible)} />
          ) : (
            <div className="flex justify-center py-(--spacing-32)">
              <Empty
                title={query.trim() ? "검색 결과가 없습니다" : "아직 등록된 맛집이 없어요"}
                description="찾은 맛집을 직접 올려 주세요"
                primaryLabel="맛집 올리기"
                onPrimary={() => router.push("/restaurants/new")}
              />
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div
            ref={sentinel}
            className="flex items-center justify-center gap-(--spacing-8) px-(--spacing-20) pt-(--spacing-20) pb-(--spacing-32)"
          >
            {hasMore ? (
              <>
                <Spinner />
                <span className="body-md text-text-tertiary">맛집을 더 불러오는 중…</span>
              </>
            ) : (
              <span className="body-md text-text-tertiary">더 이상 글이 없습니다</span>
            )}
          </div>
        )}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-(--spacing-24) z-30">
        <div className="mx-auto flex w-full max-w-page justify-end px-(--spacing-20)">
          <Button size="lg" icon="plus" className="pointer-events-auto w-[170px]" onClick={() => router.push("/restaurants/new")}>
            맛집 올리기
          </Button>
        </div>
      </div>
    </>
  );
}
