/* ============================================================
   Unichat (app.unichat.ge) catalog sync — payload shaping only.
   Builds the Unichat product payload from our domain model.
   Sending is done server-side by /api/unichat/sync-all
   (replace_all), which the Supabase database webhook and the
   nightly cron invoke — so every product change reaches Unichat
   regardless of which code path made it. Env-gated on the
   server: if UNICHAT_CATALOG_URL / _API_KEY are empty it is a
   no-op, so product saves never block or break.
   ============================================================ */

import type { Brand, Category, Product } from "./types";

export interface UnichatProduct {
  /** stable product id — never changes on edit */
  external_id: string;
  title: string;
  subtitle?: string;
  description: string;
  attributes: Record<string, string>;
  /** every available volume/size with its own price */
  variants: { label: string; price: number }[];
  /** "from" price = minimum across variants */
  price: number;
  currency: "GEL";
  in_stock: boolean;
  /** usage instructions — the bot shares these only after the user agrees */
  usage_instructions?: string;
  image_url?: string;
  /** hidden knowledge for the bot — never shown publicly */
  ai_comment?: string;
  updated_at: string;
}

const clean = (s?: string | null) => (s || "").trim();

/** A product belongs in the bot catalog only when it's live on-site AND flagged for AI. */
export function inBotCatalog(p: Product): boolean {
  return p.visible !== false && p.inAi !== false;
}

export function toUnichatProduct(p: Product, brands: Brand[], cats: Category[]): UnichatProduct {
  const brand = brands.find((b) => b.id === p.brand);
  const cat = cats.find((c) => c.id === p.cat);

  const attributes: Record<string, string> = {};
  if (brand?.name) attributes["ბრენდი"] = brand.name;
  if (cat?.name) attributes["კატეგორია"] = cat.name;
  const colors = (p.colors || []).map((c) => c.n).filter(Boolean).join(", ");
  if (colors) attributes["ფერი"] = colors;

  // each volume/size with its own price (so the bot can quote per-variant)
  const variants = (p.sizes || [])
    .filter((s) => s.l && s.l !== "—")
    .map((s) => ({ label: s.l, price: s.p }));

  const prices = variants.map((v) => v.price).filter((x) => x > 0);
  const price = prices.length ? Math.min(...prices) : 0;

  const ai_comment = [p.aiComment, p.aiInfo].map(clean).filter(Boolean).join("\n\n");

  return {
    external_id: p.id,
    title: p.name,
    subtitle: clean(p.subtitle) || undefined,
    description: clean(p.desc),
    attributes,
    variants,
    price,
    currency: "GEL",
    in_stock: p.visible !== false,
    usage_instructions: clean(p.usage) || undefined,
    image_url: p.image || undefined,
    ai_comment: ai_comment || undefined,
    updated_at: new Date().toISOString(),
  };
}
