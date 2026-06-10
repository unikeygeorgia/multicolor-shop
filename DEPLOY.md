# Multicolor — deployment & platform setup

The app is a standard **Next.js 14** project. It runs today on its built-in
demo runtime (catalog from `lib/data.ts`, cart/orders/admin persisted in the
browser's localStorage). The steps below connect the real platforms.

---

## 1. GitHub → Vercel (auto-deploy on push)

You chose the Vercel GitHub integration, so no access token is handed to the
assistant — Vercel pulls from GitHub and deploys on every push.

1. Push this repo to `github.com/unikeygeorgia/multicolor-shop` (first push):
   ```bash
   git add -A && git commit -m "Multicolor storefront + admin" && git push -u origin master
   ```
2. In the **correct Vercel account**, go to **Add New → Project**, import
   `unikeygeorgia/multicolor-shop`. Framework preset: **Next.js** (auto-detected).
3. Add the environment variables from step 2 below, then **Deploy**.
4. From now on every `git push` triggers a build + deploy automatically.

> The Vercel connector currently linked in this workspace is signed into a
> different account ("Noe Tikadze's projects"). Reconnect the Vercel connector
> to the account that should own multicolor-shop before asking the assistant to
> deploy from here.

---

## 2. Supabase (database)

The Supabase connector here is signed into another account ("Unichat.ge").
Reconnect it to the **multicolor-shop Supabase account**, then:

1. Create (or open) the multicolor-shop project.
2. Run `supabase/schema.sql` in the SQL editor to create the tables + RLS.
3. Copy `.env.local.example` → `.env.local` and fill in the project URL + keys
   (Project Settings → API). Add the same vars in Vercel → Project → Settings →
   Environment Variables.
4. Seed the catalog: the assistant can generate inserts from `lib/data.ts` once
   the project is connected.

### Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | admin writes / seeding — never commit |

---

## 3. Wiring the app to Supabase (next step)

Once the project is connected and seeded, the data layer swaps from the
localStorage store to Supabase:

- Catalog reads (`products`, `brands`, `categories`, …) move to server
  components / queries → restores SSR + SEO.
- Cart stays client-side; **checkout** inserts into `orders`.
- The **admin panel** reads/writes Supabase (products, brands, categories,
  promotions, hero, order status) instead of the localStorage overlay.

The store in `components/store-provider.tsx` is the single seam to replace.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Font: **FiraGO** (self-hosted woff2 in `public/fonts`, weights 400–800,
full Georgian coverage) — no external font CDN.
