/* Map between Supabase row shapes (snake_case / reserved words) and the
   app's domain types (lib/types.ts). */

import type {
  Brand,
  Bundle,
  Category,
  HeroSlide,
  Order,
  Product,
  Promotion,
} from "./types";

/* ---------- products ---------- */
export function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    brand: r.brand as string,
    cat: r.cat as string,
    name: r.name as string,
    subtitle: (r.subtitle as string) || "",
    slug: (r.slug as string) || undefined,
    desc: (r.descr as string) || "",
    usage: (r.usage as string) || "",
    aiInfo: (r.ai_info as string) || "",
    image: (r.image as string) || "",
    document: (r.document as string) || "",
    visible: r.visible == null ? true : Boolean(r.visible),
    inAi: r.in_ai == null ? true : Boolean(r.in_ai),
    sizes: (r.sizes as Product["sizes"]) || [],
    colors: (r.colors as Product["colors"]) || [],
    specs: (r.specs as Product["specs"]) || {},
    tags: (r.tags as string[]) || [],
    featured: Boolean(r.featured),
    salePct: r.sale_pct == null ? undefined : (r.sale_pct as number),
  };
}
export function productToRow(p: Product) {
  return {
    id: p.id,
    brand: p.brand,
    cat: p.cat,
    name: p.name,
    subtitle: p.subtitle || null,
    slug: p.slug || null,
    descr: p.desc || "",
    usage: p.usage || null,
    ai_info: p.aiInfo || null,
    image: p.image || null,
    document: p.document || null,
    visible: p.visible !== false,
    in_ai: p.inAi !== false,
    sizes: p.sizes,
    colors: p.colors,
    specs: p.specs,
    tags: p.tags,
    featured: !!p.featured,
    sale_pct: p.salePct ?? null,
  };
}

/* ---------- categories ---------- */
export function rowToCategory(r: Record<string, unknown>): Category {
  return {
    id: r.id as string,
    name: r.name as string,
    parentId: (r.parent_id as string) || null,
    group: (r.group as Category["group"]) ?? null,
    facets: (r.facets as string[]) || [],
    order: (r.order as number) ?? 0,
    sub: (r.sub as string[]) || undefined,
  };
}
export function categoryToRow(c: Category) {
  return {
    id: c.id,
    name: c.name,
    parent_id: c.parentId ?? null,
    group: c.group ?? null,
    facets: c.facets,
    order: c.order,
    sub: c.sub ?? null,
  };
}

/* ---------- promotions ---------- */
export function rowToPromotion(r: Record<string, unknown>): Promotion {
  return {
    id: r.id as string,
    name: r.name as string,
    type: r.type as string,
    value: Number(r.value),
    target: r.target as string,
    from: (r.from_date as string) || "",
    to: (r.to_date as string) || "",
    active: Boolean(r.active),
  };
}
export function promotionToRow(x: Promotion) {
  return {
    id: x.id,
    name: x.name,
    type: x.type,
    value: x.value,
    target: x.target,
    from_date: x.from || null,
    to_date: x.to || null,
    active: x.active,
  };
}

/* ---------- bundles ---------- */
export function rowToBundle(r: Record<string, unknown>): Bundle {
  return {
    id: r.id as string,
    name: r.name as string,
    items: (r.items as string[]) || [],
    note: (r.note as string) || "",
    price: Number(r.price),
    oldPrice: Number(r.old_price),
  };
}

/* ---------- hero ---------- */
export function rowToHero(r: Record<string, unknown>): HeroSlide {
  return {
    id: r.id as string,
    kicker: (r.kicker as string) || "",
    title: r.title as string,
    sub: (r.sub as string) || "",
    cta: (r.cta as string) || "",
    link: (r.link as string) || "",
    tint: (r.tint as HeroSlide["tint"]) || "paint",
  };
}
export function heroToRow(h: HeroSlide, order: number) {
  return {
    id: h.id,
    kicker: h.kicker,
    title: h.title,
    sub: h.sub,
    cta: h.cta,
    link: h.link,
    tint: h.tint,
    order,
  };
}

/* ---------- orders ---------- */
export function rowToOrder(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    type: r.type as Order["type"],
    status: r.status as Order["status"],
    date: (r.created_at as string) || new Date().toISOString(),
    customer: r.customer as Order["customer"],
    items: (r.items as Order["items"]) || [],
  };
}
export function orderToRow(o: Order) {
  return {
    id: o.id,
    type: o.type,
    status: o.status,
    created_at: o.date,
    customer: o.customer,
    items: o.items,
  };
}

/* brands & surfaces & cat_groups map 1:1 — no transform needed */
export type { Brand };
