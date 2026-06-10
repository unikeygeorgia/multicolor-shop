"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Product } from "@/lib/types";
import { fmt, hasTag, inStock, minPrice, salePrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";

const STATUS_LABELS: Record<string, string> = {
  new: "ახალი",
  sale: "ფასდაკლებით",
  stock: "მარაგშია",
};

function toggle(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
}

export function ShopClient() {
  const { db, catById, brandById, surfName } = useStore();
  const params = useSearchParams();

  const priceMax = useMemo(
    () =>
      Math.ceil(
        Math.max(...db.products.flatMap((p) => p.sizes.map((s) => s.p))) / 10
      ) * 10,
    [db.products]
  );

  /* ---- filter state (seeded from URL) ---- */
  const [cats, setCats] = useState<string[]>(params.get("cat") ? [params.get("cat")!] : []);
  const [brands, setBrands] = useState<string[]>(params.get("brand") ? [params.get("brand")!] : []);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>(params.get("tag") ? [params.get("tag")!] : []);
  const [pmin, setPmin] = useState(0);
  const [pmax, setPmax] = useState(priceMax);
  const q = (params.get("q") || "").trim();
  const [sort, setSort] = useState("pop");
  const [sheetOpen, setSheetOpen] = useState(false);

  const effPrice = (p: Product) => salePrice(p, minPrice(p));
  const maxEffPrice = (p: Product) => salePrice(p, Math.max(...p.sizes.map((s) => s.p)));

  const activeFacets = useMemo(() => {
    if (cats.length === 0) return ["size", "color", "surface"];
    const set = new Set<string>();
    cats.forEach((cid) => (catById(cid)?.facets || []).forEach((f) => set.add(f)));
    return [...set];
  }, [cats, catById]);

  const matches = (p: Product) => {
    if (brands.length && !brands.includes(p.brand)) return false;
    if (cats.length && !cats.includes(p.cat)) return false;
    if (sizes.length && !p.sizes.some((s) => sizes.includes(s.l))) return false;
    if (colors.length && !(p.colors || []).some((c) => colors.includes(c.n))) return false;
    if (surfaces.length) {
      const sf = (p.specs && p.specs.surface) || [];
      if (!sf.some((s) => surfaces.includes(s))) return false;
    }
    if (status.includes("new") && !hasTag(p, "new")) return false;
    if (status.includes("sale") && !p.salePct) return false;
    if (status.includes("stock") && !inStock(p)) return false;
    const lo = effPrice(p), hi = maxEffPrice(p);
    if (hi < pmin || lo > pmax) return false;
    if (q) {
      const hay = (
        p.name + " " + (p.desc || "") + " " +
        (brandById(p.brand)?.name || "") + " " + (catById(p.cat)?.name || "")
      ).toLowerCase();
      if (!q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  };

  const list = useMemo(() => {
    const l = db.products.filter(matches);
    if (sort === "asc") l.sort((a, b) => effPrice(a) - effPrice(b));
    else if (sort === "desc") l.sort((a, b) => effPrice(b) - effPrice(a));
    else if (sort === "new") l.sort((a, b) => (hasTag(b, "new") ? 1 : 0) - (hasTag(a, "new") ? 1 : 0));
    else l.sort((a, b) => ((b.featured ? 2 : 0) + (b.salePct ? 1 : 0)) - ((a.featured ? 2 : 0) + (a.salePct ? 1 : 0)));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.products, cats, brands, sizes, colors, surfaces, status, pmin, pmax, q, sort]);

  /* ---- option pools ---- */
  const pool = useMemo(
    () =>
      db.products.filter(
        (p) =>
          (cats.length === 0 || cats.includes(p.cat)) &&
          (brands.length === 0 || brands.includes(p.brand))
      ),
    [db.products, cats, brands]
  );
  const sizeOptions = useMemo(() => {
    const m = new Map<string, number>();
    pool.forEach((p) => p.sizes.forEach((s) => m.set(s.l, (m.get(s.l) || 0) + 1)));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "ka", { numeric: true }));
  }, [pool]);
  const colorOptions = useMemo(() => {
    const m = new Map<string, { n: string; h: string; ral?: string }>();
    pool.forEach((p) => (p.colors || []).forEach((c) => { if (!m.has(c.n)) m.set(c.n, c); }));
    return [...m.values()];
  }, [pool]);

  /* ---- chips ---- */
  const chips: { k: string; v: string; label: string }[] = [];
  cats.forEach((id) => chips.push({ k: "cats", v: id, label: catById(id)?.name || id }));
  brands.forEach((id) => chips.push({ k: "brands", v: id, label: brandById(id)?.name || id }));
  sizes.forEach((l) => chips.push({ k: "sizes", v: l, label: l }));
  colors.forEach((n) => chips.push({ k: "colors", v: n, label: n }));
  surfaces.forEach((s) => chips.push({ k: "surfaces", v: s, label: surfName(s) }));
  status.forEach((s) => chips.push({ k: "status", v: s, label: STATUS_LABELS[s] }));
  if (pmin > 0 || pmax < priceMax) chips.push({ k: "price", v: "", label: `${pmin}–${pmax} ₾` });
  if (q) chips.push({ k: "q", v: "", label: `„${q}“` });

  const removeChip = (k: string, v: string) => {
    if (k === "cats") setCats((s) => s.filter((x) => x !== v));
    else if (k === "brands") setBrands((s) => s.filter((x) => x !== v));
    else if (k === "sizes") setSizes((s) => s.filter((x) => x !== v));
    else if (k === "colors") setColors((s) => s.filter((x) => x !== v));
    else if (k === "surfaces") setSurfaces((s) => s.filter((x) => x !== v));
    else if (k === "status") setStatus((s) => s.filter((x) => x !== v));
    else if (k === "price") { setPmin(0); setPmax(priceMax); }
  };
  const clearAll = () => {
    setCats([]); setBrands([]); setSizes([]); setColors([]); setSurfaces([]); setStatus([]);
    setPmin(0); setPmax(priceMax);
  };

  const title =
    cats.length === 1
      ? catById(cats[0])?.name || "სრული კატალოგი"
      : status.includes("new")
      ? "სიახლეები"
      : "სრული კატალოგი";

  const FilterBody = (
    <div id="filter-body">
      <details className="fgroup" open>
        <summary>კატეგორია</summary>
        <div className="fbody">
          {[...db.categories].sort((a, b) => a.order - b.order).map((c) => (
            <label className="frow" key={c.id}>
              <input type="checkbox" checked={cats.includes(c.id)} onChange={() => setCats((s) => toggle(s, c.id))} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </details>

      <details className="fgroup" open>
        <summary>ბრენდი</summary>
        <div className="fbody">
          {db.brands.map((b) => (
            <label className="frow" key={b.id}>
              <input type="checkbox" checked={brands.includes(b.id)} onChange={() => setBrands((s) => toggle(s, b.id))} />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </details>

      {activeFacets.includes("size") && (
        <details className="fgroup" open>
          <summary>შეფუთვა / ზომა</summary>
          <div className="fbody scrolly">
            {sizeOptions.map(([l, n]) => (
              <label className="frow" key={l}>
                <input type="checkbox" checked={sizes.includes(l)} onChange={() => setSizes((s) => toggle(s, l))} />
                <span>{l} <i>({n})</i></span>
              </label>
            ))}
          </div>
        </details>
      )}

      {activeFacets.includes("color") && colorOptions.length > 0 && (
        <details className="fgroup" open>
          <summary>ფერი</summary>
          <div className="fbody swgrid">
            {colorOptions.map((c) => (
              <button
                key={c.n}
                className={`swbtn${colors.includes(c.n) ? " on" : ""}`}
                title={`${c.n}${c.ral ? " · " + c.ral : ""}`}
                aria-pressed={colors.includes(c.n)}
                onClick={() => setColors((s) => toggle(s, c.n))}
              >
                <span className="dot" style={{ background: c.h }} />
                <span className="swname">{c.n}</span>
              </button>
            ))}
          </div>
        </details>
      )}

      {activeFacets.includes("surface") && (
        <details className="fgroup" open>
          <summary>ზედაპირი / დანიშნულება</summary>
          <div className="fbody">
            {db.surfaces.map((s) => (
              <label className="frow" key={s.id}>
                <input type="checkbox" checked={surfaces.includes(s.id)} onChange={() => setSurfaces((x) => toggle(x, s.id))} />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      <details className="fgroup" open>
        <summary>ფასი (₾)</summary>
        <div className="fbody">
          <div className="price-vals num">
            <span>{fmt(pmin)}</span>
            <span>{fmt(pmax)}</span>
          </div>
          <div className="dual-range">
            <input
              type="range" min={0} max={priceMax} step={1} value={pmin}
              onChange={(e) => setPmin(Math.min(+e.target.value, pmax))}
            />
            <input
              type="range" min={0} max={priceMax} step={1} value={pmax}
              onChange={(e) => setPmax(Math.max(+e.target.value, pmin))}
            />
          </div>
        </div>
      </details>

      <details className="fgroup" open>
        <summary>სტატუსი</summary>
        <div className="fbody">
          {(["new", "sale", "stock"] as const).map((s) => (
            <label className="frow" key={s}>
              <input type="checkbox" checked={status.includes(s)} onChange={() => setStatus((x) => toggle(x, s))} />
              <span>{STATUS_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );

  return (
    <main className="wrap" data-screen-label="კატალოგი">
      <nav className="crumbs" aria-label="ნავიგაცია">
        <Link href="/">მთავარი</Link>
        <span className="sep">/</span>
        <span className="here">კატალოგი</span>
      </nav>

      <div className="shop-layout">
        <aside className="rail" aria-label="ფილტრები">
          <h4>ფილტრები</h4>
          {FilterBody}
        </aside>

        <section>
          <div className="shop-toolbar">
            <h1 id="shop-title">{title}</h1>
            <span className="rmeta">
              <b className="num">{list.length}</b> პროდუქტი
            </span>
            <button className="btn-line sm open-filters" onClick={() => setSheetOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              ფილტრები {chips.length ? `(${chips.length})` : ""}
            </button>
            <label className="sortbox">
              დალაგება
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="pop">პოპულარული</option>
                <option value="asc">ფასი: ზრდადობით</option>
                <option value="desc">ფასი: კლებადობით</option>
                <option value="new">ჯერ ახალი</option>
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="shop-chips" aria-label="არჩეული ფილტრები">
              {chips.map((c) => (
                <button key={`${c.k}-${c.v}`} className="chip active" onClick={() => removeChip(c.k, c.v)}>
                  {c.label} <span className="x">×</span>
                </button>
              ))}
              <button className="btn-ghost" onClick={clearAll}>გასუფთავება</button>
            </div>
          )}

          {list.length > 0 ? (
            <div className="pgrid cols-3" id="pgrid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="glyph">◌</div>
              <h3>ვერაფერი მოიძებნა</h3>
              <p>სცადეთ ფილტრების შემსუბუქება ან გასუფთავება.</p>
              <button className="btn-line sm" style={{ marginTop: 14 }} onClick={clearAll}>
                ფილტრების გასუფთავება
              </button>
            </div>
          )}
        </section>
      </div>

      {/* mobile filter sheet */}
      <div className={`fsheet${sheetOpen ? " open" : ""}`}>
        <div className="scrim" onClick={() => setSheetOpen(false)} />
        <div className="sheet">
          <div className="sheet-head">
            <b>ფილტრები</b>
            <button className="btn-ghost" onClick={clearAll}>გასუფთავება</button>
          </div>
          <div className="sheet-body">{sheetOpen && FilterBody}</div>
          <div className="sheet-foot">
            <button className="btn" onClick={() => setSheetOpen(false)}>შედეგების ნახვა</button>
          </div>
        </div>
      </div>
    </main>
  );
}
