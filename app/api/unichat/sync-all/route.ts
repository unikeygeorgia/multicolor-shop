/* ============================================================
   /api/unichat/sync-all — full catalog push (replace_all).
   Server gathers every in-catalog product straight from the DB,
   shapes the Unichat payload, and POSTs one request with the
   secret Bearer key (never exposed to the client). No-op when
   UNICHAT_CATALOG_URL / _API_KEY are empty.
   ============================================================ */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rowToProduct, rowToCategory } from "@/lib/mappers";
import { toUnichatProduct, inBotCatalog } from "@/lib/unichat";
import type { Brand, Category } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const url = process.env.UNICHAT_CATALOG_URL;
  const key = process.env.UNICHAT_CATALOG_API_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, skipped: true, sent: 0 });
  if (!supabase) return NextResponse.json({ ok: false, error: "db unavailable" }, { status: 500 });

  // gather catalog (public-read tables, anon client is fine)
  const [pr, br, ca] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("brands").select("*"),
    supabase.from("categories").select("*"),
  ]);
  if (pr.error) return NextResponse.json({ ok: false, error: pr.error.message }, { status: 500 });

  const brands = (br.data || []) as Brand[];
  const cats = (ca.data || []).map(rowToCategory) as Category[];
  const products = (pr.data || []).map(rowToProduct);

  const list = products
    .filter(inBotCatalog)
    .map((p) => toUnichatProduct(p, brands, cats))
    .slice(0, 1000); // one request, max 1000 products

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "replace_all", products: list }),
    });
    let resp: { upserted?: number; deleted?: number } = {};
    try { resp = await r.json(); } catch { /* Unichat may return an empty body */ }
    if (!r.ok) return NextResponse.json({ ok: false, status: r.status, sent: list.length }, { status: 200 });
    return NextResponse.json({
      ok: true,
      sent: list.length,
      upserted: resp.upserted ?? list.length,
      deleted: resp.deleted ?? 0,
    });
  } catch (e) {
    console.error("unichat sync-all failed", e);
    return NextResponse.json({ ok: false, sent: list.length, error: "network" }, { status: 200 });
  }
}
