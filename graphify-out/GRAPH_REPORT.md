# Graph Report - .  (2026-07-01)

## Corpus Check
- Corpus is ~38,751 words - fits in a single context window. You may not need a graph.

## Summary
- 403 nodes · 702 edges · 29 communities (17 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.76)
- Token cost: 115,932 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_Store Data & State|Store Data & State]]
- [[_COMMUNITY_Storefront Product UI|Storefront Product UI]]
- [[_COMMUNITY_Homepage Sections & Pages|Homepage Sections & Pages]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Icons & Site Header|Icons & Site Header]]
- [[_COMMUNITY_Color Picker (RALRGB)|Color Picker (RAL/RGB)]]
- [[_COMMUNITY_Auth & Site Chrome|Auth & Site Chrome]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Deployment Architecture|Deployment Architecture]]
- [[_COMMUNITY_Account & Addresses|Account & Addresses]]
- [[_COMMUNITY_Image Picker|Image Picker]]
- [[_COMMUNITY_Order & Admin API|Order & Admin API]]
- [[_COMMUNITY_Admin Content Editors|Admin Content Editors]]
- [[_COMMUNITY_Slug & Transliteration|Slug & Transliteration]]
- [[_COMMUNITY_Next.js Middleware|Next.js Middleware]]
- [[_COMMUNITY_Adhesive Brands|Adhesive Brands]]
- [[_COMMUNITY_Order Detail View|Order Detail View]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Asmako Brand|Asmako Brand]]
- [[_COMMUNITY_Premium Brand|Premium Brand]]
- [[_COMMUNITY_Sobsan Brand|Sobsan Brand]]
- [[_COMMUNITY_Stargil Brand|Stargil Brand]]
- [[_COMMUNITY_Teirani Brand|Teirani Brand]]
- [[_COMMUNITY_MultiColor Brand Identity|MultiColor Brand Identity]]

## God Nodes (most connected - your core abstractions)
1. `useStore()` - 35 edges
2. `compilerOptions` - 16 edges
3. `ProductCard()` - 13 edges
4. `fmt()` - 13 edges
5. `useAuth()` - 12 edges
6. `StoreValue` - 10 edges
7. `Product` - 10 edges
8. `ph()` - 10 edges
9. `ProductClient()` - 9 edges
10. `salePrice()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Dashboard()` --calls--> `fmt()`  [EXTRACTED]
  app/admin/admin-client.tsx → lib/utils.ts
- `SalesCalendarView()` --calls--> `fmt()`  [EXTRACTED]
  app/admin/admin-client.tsx → lib/utils.ts
- `ContactClient()` --calls--> `prodById()`  [INFERRED]
  app/contact/contact-client.tsx → lib/data.ts
- `AboutPage()` --calls--> `useStore()`  [EXTRACTED]
  app/about/page.tsx → components/store-provider.tsx
- `SettingsView()` --calls--> `useStore()`  [EXTRACTED]
  app/admin/admin-client.tsx → components/store-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Supabase-Wired App Components** — deploy_storefront, deploy_admin_panel, deploy_checkout, deploy_supabase_project [EXTRACTED 0.85]
- **Vercel Deployment Flow** — deploy_github_repo, deploy_vercel_cli, deploy_vercel_github_autodeploy, deploy_vercel_deployment [EXTRACTED 0.85]
- **Environment Config Chain** — deploy_env_production, deploy_anon_publishable_key, deploy_next_build, deploy_row_level_security [INFERRED 0.75]
- **Shop Brand Catalogue** — public_brand_logos_asmako_asmako, public_brand_logos_bauer_bauer, public_brand_logos_proian_proian, public_brand_logos_sobsan_sobsan, public_brand_logos_stargil_stargil, public_brand_logos_teirani_teirani, public_brand_logos_premium_premium, public_brand_logos_starbond_starbond [INFERRED 0.75]

## Communities (29 total, 12 thin omitted)

### Community 0 - "Admin Dashboard"
Cohesion: 0.03
Nodes (20): ACCENTS, BoardApi, BoardCtx, CNode, ColorRow, Dashboard(), DropPos, Editor (+12 more)

### Community 1 - "Store Data & State"
Cohesion: 0.09
Nodes (41): applyPromoToProduct(), clone(), DEFAULT_SETTINGS, StoreContext, StoreProvider(), StoreValue, ToastItem, categoryToRow() (+33 more)

### Community 2 - "Storefront Product UI"
Cohesion: 0.11
Nodes (22): AboutPage(), BrandClient(), GALLERY_SHOTS, ProductClient(), ShopClient(), STATUS_LABELS, ProductCard(), ProductGrid() (+14 more)

### Community 3 - "Homepage Sections & Pages"
Cohesion: 0.10
Nodes (22): AccountPage(), AdminClient(), AdminGate(), SettingsView(), CartPage(), CITIES, LoginPage(), HomePage() (+14 more)

### Community 4 - "NPM Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, class-variance-authority, clsx, next, react, react-dom, @supabase/supabase-js, tailwind-merge (+18 more)

### Community 5 - "Icons & Site Header"
Cohesion: 0.13
Nodes (18): CategoryIcon(), ICONS, s, ITEMS, TrustBand(), base, BurgerIcon(), CartIcon() (+10 more)

### Community 6 - "Color Picker (RAL/RGB)"
Cohesion: 0.12
Nodes (12): ColorField(), ColorPicker(), h2(), hexToRgb(), hsvToRgb(), nearestRal(), normHex(), PickerCore() (+4 more)

### Community 7 - "Auth & Site Chrome"
Cohesion: 0.12
Nodes (11): ContactClient(), metadata, AuthContext, AuthProvider(), AuthResult, AuthValue, NOT_CONFIGURED, SiteChrome() (+3 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Deployment Architecture"
Cohesion: 0.15
Nodes (19): Admin Panel, Supabase Anon/Publishable Key, Checkout Order Flow, .env.local, .env.production, NEXT_PUBLIC_SUPABASE Env Vars, FiraGO Self-Hosted Font, GitHub Repo (unikeygeorgia/multicolor-shop) (+11 more)

### Community 10 - "Account & Addresses"
Cohesion: 0.15
Nodes (5): Address, ic, STATUS, Tab, TYPE

### Community 11 - "Image Picker"
Cohesion: 0.15
Nodes (4): ImageField(), ImagePickerProps, POSITIONS, TYPE_FIT

### Community 12 - "Order & Admin API"
Cohesion: 0.39
Nodes (7): Body, genId(), POST(), randomPassword(), getAdminClient(), isAdminConfigured, OrderCustomer

### Community 13 - "Admin Content Editors"
Cohesion: 0.33
Nodes (6): BrandEditor(), flatCatTree(), ProductEditor(), PromoEditor(), rootCatId(), uid()

### Community 14 - "Slug & Transliteration"
Cohesion: 0.67
Nodes (3): KA_MAP, slugify(), transliterate()

### Community 16 - "Adhesive Brands"
Cohesion: 0.67
Nodes (3): Bauer, Proian, Starbond

## Knowledge Gaps
- **114 isolated node(s):** `extends`, `STATUS`, `TYPE`, `Address`, `Tab` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useStore()` connect `Homepage Sections & Pages` to `Admin Dashboard`, `Store Data & State`, `Storefront Product UI`, `Icons & Site Header`, `Auth & Site Chrome`, `Account & Addresses`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Homepage Sections & Pages` to `Admin Dashboard`, `Account & Addresses`, `Icons & Site Header`, `Auth & Site Chrome`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `fmt()` connect `Storefront Product UI` to `Admin Dashboard`, `Order Detail View`, `Account & Addresses`, `Homepage Sections & Pages`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `extends`, `STATUS`, `TYPE` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.02631578947368421 - nodes in this community are weakly interconnected._
- **Should `Store Data & State` be split into smaller, more focused modules?**
  _Cohesion score 0.08784313725490196 - nodes in this community are weakly interconnected._
- **Should `Storefront Product UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11097560975609756 - nodes in this community are weakly interconnected._