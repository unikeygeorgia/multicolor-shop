/* ============================================================
   /api/unichat/sync-all — full catalog push (replace_all).
   Server gathers every in-catalog product straight from the DB,
   shapes the Unichat payload, and POSTs one request with the
   secret Bearer key (never exposed to the client). No-op when
   UNICHAT_CATALOG_URL / _API_KEY are empty.

   Two entry points share one implementation:
     POST — the admin "ყველა გადაგზავნა" button (unchanged).
     GET  — the Supabase DB webhook and the nightly pg_cron job
            (supabase/unichat_sync_webhook.sql). Because it re-sends
            the COMPLETE catalog, replace_all self-heals any upsert
            or delete that was missed.
   ============================================================ */

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminClient, isAdminConfigured } from "@/lib/supabase-admin";
import { rowToProduct, rowToCategory } from "@/lib/mappers";
import { toUnichatProduct, inBotCatalog } from "@/lib/unichat";
import type { Brand, Category } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gather the in-catalog products from the DB and push them as one replace_all. */
async function replaceAll() {
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
    if (!r.ok) {
      console.error("unichat replace_all failed (HTTP)", r.status, { sent: list.length });
      return NextResponse.json({ ok: false, status: r.status, sent: list.length }, { status: 200 });
    }
    const upserted = resp.upserted ?? list.length;
    const deleted = resp.deleted ?? 0;
    // one line per run so catalog freshness is visible in Vercel runtime logs
    console.log("unichat replace_all ok", { sent: list.length, upserted, deleted });
    return NextResponse.json({ ok: true, sent: list.length, upserted, deleted });
  } catch (e) {
    console.error("unichat sync-all failed", e);
    return NextResponse.json({ ok: false, sent: list.length, error: "network" }, { status: 200 });
  }
}

/** Admin "ყველა გადაგზავნა" button. */
export async function POST() {
  return replaceAll();
}

/**
 * Reconcile entry point for the Supabase DB webhook and the nightly pg_cron
 * job (both send `Authorization: Bearer <secret>` read from Supabase Vault),
 * and for a Vercel cron if CRON_SECRET is ever set on the project.
 *
 * FAILS CLOSED. The bearer is accepted only if it matches CRON_SECRET (when
 * set) or the Vault secret, checked through a service_role-only RPC so the
 * secret never leaves the database. With no verifier configured, or on any
 * error, the request is refused.
 */
export async function GET(req: Request) {
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!(await isAuthorizedBearer(bearer))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return replaceAll();
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function isAuthorizedBearer(bearer: string): Promise<boolean> {
  if (!bearer) return false;
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && constantTimeEqual(bearer, envSecret)) return true;
  if (!isAdminConfigured) return false;
  try {
    const { data, error } = await getAdminClient().rpc("unichat_check_cron_secret", { candidate: bearer });
    if (error) {
      console.error("unichat sync-all: vault secret check failed", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("unichat sync-all: vault secret check threw", e);
    return false;
  }
}
