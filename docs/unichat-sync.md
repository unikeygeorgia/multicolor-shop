# Unichat catalog sync — how it works and how to operate it

Multicolor's AI bot (a tenant of Unichat, app.unichat.ge) answers product
questions from a `products` table in **Unichat's** Supabase project. Nothing in
Unichat pulls; this site **pushes** via `POST https://app.unichat.ge/api/catalog`
(`Authorization: Bearer <catalog_api_key>`). When the push stops, the bot goes
stale silently — which is what happened for 16 days in September 2026.

## Failure modes that caused the outage

1. The only push was **browser-side, fire-and-forget** on admin save
   (`components/store-provider.tsx` → `fetch("/api/unichat/sync")`, errors
   swallowed). It fired only for edits made through the admin UI in an open
   tab; any other change path produced no push and nothing reported it.
2. The relay returns `{ ok: true, skipped: true }` when `UNICHAT_CATALOG_URL` /
   `UNICHAT_CATALOG_API_KEY` are unset on the Vercel project — saves "succeed"
   while nothing reaches Unichat.
3. This app runs on Vercel (`multicolorge.vercel.app`); the `multicolor.ge`
   domain pointed at a Cloudways host returning 403. Restoring the domain is a
   separate task from restoring the sync.

## What runs now

| Piece | Path | Triggered by | Auth |
|---|---|---|---|
| Full push (`replace_all`) | `GET /api/unichat/sync-all` | Vercel cron daily 03:00 UTC **and** the DB webhook | `Authorization: Bearer <CRON_SECRET>` — fails closed |
| Same, admin button | `POST /api/unichat/sync-all` | "ყველა გადაგზავნა" in admin settings | none (unchanged) |
| Supabase keep-alive | `GET /api/keepalive` | Vercel cron daily 04:00 UTC | none, deliberately |
| DB webhook | `supabase/unichat_sync_webhook.sql` | any INSERT/UPDATE/DELETE on `products` (statement-level) | reads Vault `unichat_cron_secret` |

`replace_all` always sends the **complete** in-catalog set, so every run
self-heals missed upserts *and* missed deletes. With ~19 products it is cheap
enough to run on every change. Crons run only on the **Production**
deployment, so this code must be deployed to production for them to start.

### Env vars on the Vercel project (Production)

| Var | Value |
|---|---|
| `UNICHAT_CATALOG_URL` | `https://app.unichat.ge/api/catalog` |
| `UNICHAT_CATALOG_API_KEY` | from Unichat: `select catalog_api_key from tenants where id = 'e16488c5-cd19-44cd-9105-1e8097141ff5'` |
| `CRON_SECRET` | random; **must equal** Vault `unichat_cron_secret` |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | already set |

## Install / rotate the webhook secret

Install (one time — Supabase SQL editor or a migration):
1. `select vault.create_secret('<CRON_SECRET>', 'unichat_cron_secret');`
2. Run `supabase/unichat_sync_webhook.sql`.

Rotate `CRON_SECRET` — do both, in this order, close together:
1. Vercel → Production env → set the new value → redeploy.
2. `select vault.update_secret(id, '<new>') from vault.secrets where name = 'unichat_cron_secret';`

Change the target URL: edit `url` in `supabase/unichat_sync_webhook.sql` and
re-run it. The `.vercel.app` production alias is used on purpose — it keeps
working even while `multicolor.ge` DNS is broken.

## Verify end to end

1. Touch one product (a data no-op that still fires the statement trigger):
   `update products set visible = visible where id = 'p-455ix';`
2. Within seconds, in **Unichat's** project:
   `select external_id, title, updated_at, embedding is not null as has_embedding from products where tenant_id = 'e16488c5-cd19-44cd-9105-1e8097141ff5' order by updated_at desc limit 3;`
   → the row is on top with a fresh `updated_at` and `has_embedding = true`.
3. Multicolor's Vercel runtime logs show `unichat replace_all ok { sent, upserted, deleted }`.
4. Unichat's Vercel logs show `POST /api/catalog 200`.
5. Test a removal (set `in_ai = false`, or delete) — the row disappears from Unichat.

## Pitfalls

- `external_id` is the product `id` (`p-xxxxx`, from `uid("p")` in the admin). It
  must never change on edit or Unichat will hold duplicates.
- Never write to Unichat's `products` table directly — the endpoint regenerates
  the embedding on upsert; a direct SQL edit leaves a stale vector.
- Do not run the old browser-side push and the webhook at the same time.

## The held branch

`claude/graphify-hszjef-remove-save-hook` removes the old browser-side push.
Merge it **only after** "Verify end to end" passes, so exactly one mechanism
fires per change.
