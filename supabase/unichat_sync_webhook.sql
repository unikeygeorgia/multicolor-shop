-- ============================================================
-- Unichat catalog sync — database webhook (sender side).
--
-- After ANY insert/update/delete on public.products, ask the site to
-- push the COMPLETE catalog to Unichat (replace_all) by calling
--   GET https://multicolorge.vercel.app/api/unichat/sync-all
-- with  Authorization: Bearer <CRON_SECRET>.
--
-- Why this shape:
--  * Statement-level (FOR EACH STATEMENT): a bulk edit fires ONE push,
--    not one per row.
--  * It sits below every code path — admin UI, direct SQL, imports —
--    so no product change can bypass the sync.
--  * The site does the payload shaping (lib/unichat.ts); the DB only
--    triggers it. Posting raw rows to Unichat would send wrong field names.
--  * The bearer secret is read from Supabase Vault at fire time, so it is
--    never stored in the trigger definition. It MUST equal the CRON_SECRET
--    env var on the Vercel project (the route fails closed without it).
--  * It can NEVER block a product save: every failure is caught and
--    downgraded to a WARNING.
--
-- One-time setup (the value is NOT in this file):
--   select vault.create_secret('<CRON_SECRET>', 'unichat_cron_secret');
-- Rotate later with:
--   select vault.update_secret(id, '<new>') from vault.secrets
--     where name = 'unichat_cron_secret';
-- The .vercel.app production alias is used on purpose: it keeps working
-- even while the multicolor.ge DNS / Cloudways mapping is broken.
-- ============================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.unichat_sync_after_products_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
    from vault.decrypted_secrets
   where name = 'unichat_cron_secret'
   limit 1;

  if secret is null then
    raise warning 'unichat sync skipped: vault secret unichat_cron_secret is missing';
    return null;
  end if;

  perform net.http_get(
    url                  := 'https://multicolorge.vercel.app/api/unichat/sync-all',
    headers              := jsonb_build_object('Authorization', 'Bearer ' || secret),
    timeout_milliseconds := 15000
  );
  return null;
exception when others then
  -- never let the sync break a product save
  raise warning 'unichat sync trigger failed: %', sqlerrm;
  return null;
end;
$$;

-- Keep the function out of the PostgREST RPC surface. Postgres checks EXECUTE
-- on trigger functions when the trigger is created, not when it fires, so this
-- cannot block a product save.
revoke execute on function public.unichat_sync_after_products_change() from public, anon, authenticated;

drop trigger if exists unichat_sync_on_products_change on public.products;
create trigger unichat_sync_on_products_change
  after insert or update or delete on public.products
  for each statement
  execute function public.unichat_sync_after_products_change();
