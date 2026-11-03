/// <reference types="vite/client" />
import css from "../../app/globals.css?raw";

// globals.css를 단일 출처로 파싱 — 토큰 목록을 별도로 중복 관리하지 않음
export const tokens = [...css.matchAll(/^\s*--([\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => ({ name, value: value.trim() }));

const byName = new Map(tokens.map((t) => [t.name, t.value]));

/** var(--x) 참조를 따라가 최종 값을 반환 */
export const resolve = (value: string): string => {
  const ref = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return ref ? resolve(byName.get(ref) ?? value) : value;
};

/** var(--color-neutral-900) → color-neutral-900 */
export const alias = (value: string) => value.match(/^var\(--([\w-]+)\)$/)?.[1];

export const colorPrimitives = tokens.filter((t) => /^color-(brand|neutral|yellow|red|alpha)-/.test(t.name));
export const colorSemantics = tokens.filter((t) => /^color-(text|icon|background|border|shadow|google)-/.test(t.name));
export const byPrefix = (prefix: string) => tokens.filter((t) => t.name.startsWith(prefix));
