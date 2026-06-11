/* ============================================================
   /api/unichat/sync — server relay to the Unichat catalog API.
   Holds the secret key server-side and forwards the (already
   shaped) payload from the client. No-op when env vars are unset,
   so the integration can ship before Unichat's endpoint is live.
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = process.env.UNICHAT_CATALOG_URL;
  const key = process.env.UNICHAT_CATALOG_API_KEY;

  // not configured yet → no-op (never block product saves)
  if (!url || !key) return NextResponse.json({ ok: true, skipped: true });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const payload = JSON.stringify(body);

  // up to 3 attempts with small backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { method: "POST", headers, body: payload });
      if (r.ok) return NextResponse.json({ ok: true });
      if (attempt === 2) {
        console.error("unichat sync failed (HTTP)", r.status);
        return NextResponse.json({ ok: false, status: r.status });
      }
    } catch (e) {
      if (attempt === 2) {
        console.error("unichat sync failed (network)", e);
        return NextResponse.json({ ok: false });
      }
    }
    await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
  }
  return NextResponse.json({ ok: false });
}
