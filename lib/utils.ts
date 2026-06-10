import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Brand, Product } from "./types";

/** shadcn-style class combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------- pricing ---------- */
export function fmt(n: number): string {
  return Number(n).toFixed(2).replace(/\.00$/, "") + " ₾";
}
export function salePrice(p: Product, base: number): number {
  return p.salePct ? base * (1 - p.salePct / 100) : base;
}
export function minPrice(p: Product): number {
  return Math.min(...p.sizes.map((s) => s.p));
}
export function hasTag(p: Product, t: string): boolean {
  return (p.tags || []).includes(t);
}
export function inStock(p: Product): boolean {
  return p.sizes.some((s) => s.s > 0);
}

/* ---------- placeholder imagery (subtle stripes + label) ----------
   Mirrors the handoff's inline-SVG data-URI generator so the storefront
   renders identically before real photography is wired in. */
export function ph(label: string, tint?: string | null, w = 600, h = 600): string {
  const t = tint || "#6f6a63";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="#f2f0eb"/>` +
    `<defs><pattern id="s" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">` +
    `<rect width="14" height="14" fill="#f2f0eb"/><rect width="7" height="14" fill="#eceae3"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#s)"/>` +
    `<rect x="0" y="${h - 6}" width="${w}" height="6" fill="${t}" opacity="0.55"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="${Math.round(
      w / 32
    )}" fill="#8d8880">${label}</text>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function prodImg(p: Product, brand?: Brand, w?: number, h?: number): string {
  return ph("ფოტო · " + (brand ? brand.name : ""), brand ? brand.tint : null, w, h);
}
