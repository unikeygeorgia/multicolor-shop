# Unichat catalog sync — how it works and how to operate it

Multicolor's AI bot (a tenant of Unichat, app.unichat.ge) answers product
questions from a `products` table in **Unichat's** Supabase project. Nothing in
Unichat pulls; this site **pushes** via `POST https://app.unichat.ge/api/catalog`
(`Authorization: Bearer <catalog_api_key>`). When the push stops, the bot goes
stale silently — which is what happened for 16 days in September 2026.

## What actually failed (confirmed 2026-09-15)

A manual `POST /api/unichat/sync-all` on production, made from outside any
browser, succeeded immediately (`sent: 19, upserted: 19`). That proved the
server relay and the `UNICHAT_*` env vars were fine all along, and it restored
the catalog on the spot. The failure was mode 1 below: the browser-side push
never reached the relay. Mode 2 is a latent risk, not what happened.

### Failure modes

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
| Full push (`replace_all`) | `GET /api/unichat/sync-all` | the DB webhook **and** a nightly `pg_cron` job (03:00 UTC) | bearer verified against Vault (service_role RPC) or `CRON_SECRET` — fails closed |
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
| `UNICHAT_CATALOG_URL` | `https://app.unichat.ge/api/catalog` — already set (verified 2026-09-15) |
| `UNICHAT_CATALOG_API_KEY` | already set (verified 2026-09-15); source of truth is Unichat `tenants.catalog_api_key` |
| `SUPABASE_SERVICE_ROLE_KEY` | already set (orders API); lets the route verify the bearer against Vault |
| `CRON_SECRET` | optional env alternative to the Vault check; if set, **must equal** Vault `unichat_cron_secret` |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | already set |

## Install / rotate the webhook secret

Already installed on the project (2026-09-15): the Vault secret
`unichat_cron_secret`, the trigger, the `unichat_check_cron_secret` RPC and the
nightly `pg_cron` job. Fresh install elsewhere:
1. `select vault.create_secret('<random>', 'unichat_cron_secret');`
2. Run `supabase/unichat_sync_webhook.sql` (trigger, RPC, cron job).

Rotate the secret:
`select vault.update_secret(id, '<new>') from vault.secrets where name = 'unichat_cron_secret';`
— the webhook, the pg_cron job and the route all read Vault, so nothing else
changes. If `CRON_SECRET` is also set on Vercel, update it to the same value.

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
6. DB side: `select status_code, created from net._http_response order by id desc limit 5;`
   lists each trigger call with its HTTP status (200 once production is deployed).
7. Nightly job: `select jobname, schedule, active from cron.job;` and
   `select status, start_time from cron.job_run_details order by start_time desc limit 3;`

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
