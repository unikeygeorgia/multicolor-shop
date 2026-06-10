-- ============================================================
-- Multicolor — Supabase schema
-- Run this in the multicolor-shop Supabase project (SQL editor or
-- `supabase db push`). Mirrors lib/types.ts so the app can swap its
-- localStorage runtime for live Postgres data.
-- ============================================================

-- ---- reference tables -------------------------------------------------
create table if not exists cat_groups (
  id   text primary key,
  name text not null
);

create table if not exists surfaces (
  id   text primary key,
  name text not null
);

create table if not exists brands (
  id      text primary key,
  name    text not null,
  country text,
  tint    text,
  tagline text,
  story   text
);

create table if not exists categories (
  id      text primary key,
  name    text not null,
  "group" text references cat_groups(id),
  facets  text[] not null default '{}',
  "order" int    not null default 0,
  sub     text[]
);

-- ---- products ---------------------------------------------------------
-- sizes/colors/specs kept as jsonb to match the design's variant model:
--   sizes:  [{ "l": "10კგ", "p": 59.9, "s": 23 }]
--   colors: [{ "n": "თეთრი", "h": "#f5f4ef", "ral": "RAL 9010" }]
--   specs:  { "surface": ["interior"], "coverage": "...", "drying": "...", "base": "..." }
create table if not exists products (
  id        text primary key,
  brand     text references brands(id),
  cat       text references categories(id),
  name      text not null,
  descr     text,
  sizes     jsonb not null default '[]',
  colors    jsonb not null default '[]',
  specs     jsonb not null default '{}',
  tags      text[] not null default '{}',
  featured  boolean not null default false,
  sale_pct  int
);
create index if not exists products_brand_idx on products(brand);
create index if not exists products_cat_idx   on products(cat);

-- ---- merchandising ----------------------------------------------------
create table if not exists promotions (
  id        text primary key,
  name      text not null,
  type      text not null default 'pct',   -- 'pct' | 'fix'
  value     numeric not null,
  target    text references products(id),
  from_date date,
  to_date   date,
  active    boolean not null default true
);

create table if not exists bundles (
  id        text primary key,
  name      text not null,
  items     text[] not null default '{}',
  note      text,
  price     numeric,
  old_price numeric
);

create table if not exists hero_slides (
  id     text primary key,
  kicker text,
  title  text not null,
  sub    text,
  cta    text,
  link   text,
  tint   text,
  "order" int not null default 0
);

-- ---- orders / inquiries ----------------------------------------------
--   customer: { name, phone, city, address?, company?, note? }
--   items:    [{ pid, size, color?, qty }]
create table if not exists orders (
  id         text primary key,
  type       text not null default 'order',  -- 'order' | 'quote' | 'inquiry'
  status     text not null default 'new',    -- 'new' | 'processing' | 'done' | 'cancelled'
  created_at timestamptz not null default now(),
  customer   jsonb not null,
  items      jsonb not null default '[]'
);
create index if not exists orders_status_idx on orders(status);

-- ============================================================
-- Row Level Security
--   Catalog tables: public read. Orders: public insert (storefront
--   checkout), restricted read/update (admin only — wire to auth later).
-- ============================================================
alter table cat_groups  enable row level security;
alter table surfaces    enable row level security;
alter table brands      enable row level security;
alter table categories  enable row level security;
alter table products    enable row level security;
alter table promotions  enable row level security;
alter table bundles     enable row level security;
alter table hero_slides enable row level security;
alter table orders      enable row level security;

-- public read for catalog
do $$
declare t text;
begin
  foreach t in array array['cat_groups','surfaces','brands','categories','products','promotions','bundles','hero_slides']
  loop
    execute format($f$
      create policy "public read %1$s" on %1$s for select using (true);
    $f$, t);
  end loop;
end $$;

-- storefront can create an order/inquiry; reads stay private until admin auth is added
create policy "public insert orders" on orders for insert with check (true);
