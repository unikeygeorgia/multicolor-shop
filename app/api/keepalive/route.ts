/* ============================================================
   /api/keepalive — Supabase free-tier keep-alive.
   Supabase pauses free projects after ~7 days without activity.
   The nightly Vercel cron (see vercel.json) hits this route, which
   runs one trivial query so the project always registers activity.

   Deliberately UNauthenticated: the query reads one row from the
   public-read `brands` table — data anyone can already fetch with
   the publishable anon key — and not gating it is what guarantees
   the ping keeps working even if other configuration is missing.
   (Contrast /api/unichat/sync-all GET, which triggers an outbound
   push and therefore requires CRON_SECRET.)
   ============================================================ */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 500 });
  }
  const { error } = await supabase.from("brands").select("id").limit(1);
  if (error) {
    console.error("keepalive query failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
