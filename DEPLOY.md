# Multicolor — deployment status & remaining steps

## ✅ Done

- **Next.js app** — all pages + admin, FiraGO self-hosted, production build green.
- **Supabase** — project **multicolor-shop** (`jjwxbcmnulvakcjgzhgb`, region eu-central-1)
  on the **multicolor.ge** org. Schema applied, catalog seeded
  (8 brands, 16 categories, 55 products, 4 promotions, 3 bundles, 3 hero slides, 5 orders).
- **App wired to Supabase** — storefront reads catalog from Postgres, checkout writes
  orders, the admin panel reads/writes products, brands, categories, promotions, hero,
  and order status. Falls back to bundled seed data if env vars are missing.
- **Public keys** committed in `.env.production` (anon/publishable key — safe to ship;
  Row Level Security protects the data). Local dev uses `.env.local`.

## ⏳ Remaining — run from your computer

The sandbox can't push to GitHub or run an authenticated Vercel deploy, so these final
commands run on your machine (in the project folder):

```bash
# 1. Commit the latest changes
#    (if git complains about an existing lock: rm -f .git/index.lock)
git add -A
git commit -m "Supabase-wired storefront + admin"
git push            # to github.com/unikeygeorgia/multicolor-shop

# 2a. Fastest deploy — Vercel CLI (logs into your connected Vercel account):
npx vercel           # first run: link/confirm project; then `npx vercel --prod`

# 2b. OR auto-deploy via GitHub (recommended long-term):
#     Vercel dashboard → Add New → Project → import unikeygeorgia/multicolor-shop
#     Framework preset: Next.js (auto-detected). Deploy.
#     Every push to GitHub then builds & deploys automatically.
```

No environment variables need to be set in the Vercel dashboard — the public Supabase
config is already in `.env.production`, which `next build` reads automatically. (If you
prefer dashboard env vars instead, remove `.env.production` and add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
Vercel → Project → Settings → Environment Variables.)

## Verify after deploy

- Home/shop/product render the catalog from Supabase.
- Place a test order at checkout → it appears in **Supabase → Table editor → orders**
  and in the **admin panel → Orders**.
- Edit a product in the admin panel → reload the storefront → change is live.

## Local development

```bash
npm install
npm run dev     # http://localhost:3000  (uses .env.local)
npm run build
```
