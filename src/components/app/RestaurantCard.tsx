"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Restaurant } from "@/lib/data";
import { shortAddress, timeAgo } from "@/lib/format";
import { findUser, useAppState, useNow } from "@/lib/store";

export function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
  const state = useAppState();
  const now = useNow();
  const author = findUser(state, r.authorId)?.nickname ?? "알 수 없음";
  return (
    <Link
      href={`/restaurants/${r.id}`}
      aria-label={`${r.title} · ${shortAddress(r.address)}`}
      className="block h-full rounded-[10px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-background-brand"
    >
      <Card
        className="h-full"
        title={r.title}
        address={shortAddress(r.address)}
        description={r.summary ?? r.content}
        meta={`${author} · ${timeAgo(r.createdAt, now)}`}
        imageUrl={r.photos[0]}
      />
    </Link>
  );
}

/** 최대 1280px 안에서 1 → 2 → 3 → 4열로 확장되는 카드 그리드 */
export function RestaurantGrid({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <ul className="grid grid-cols-1 gap-(--spacing-12) sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {restaurants.map((r) => (
        <li key={r.id}>
          <RestaurantCard restaurant={r} />
        </li>
      ))}
    </ul>
  );
}
