"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Category, Product } from "@/lib/types";
import { hasTag, minPrice, salePrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icons";
import { ChevronDownIcon } from "@/components/icons";
import { brandLogoSrc } from "@/lib/brand-logos";

const STATUS_LABELS: Record<string, string> = {
  new: "ახალი",
  sale: "ფასდაკლებით",
};

function toggle(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
}

export function ShopClient() {
  const { db, catById, brandById } = useStore();
  const params = useSearchParams();

  /* ---- filter state (seeded from URL) ---- */
  const [cats, setCats] = useState<string[]>(params.get("cat") ? [params.get("cat")!] : []);
  const [brands, setBrands] = useState<string[]>(params.get("brand") ? [params.get("brand")!] : []);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>(params.get("tag") ? [params.get("tag")!] : []);
  const q = (params.get("q") || "").trim();
  const [sort, setSort] = useState("pop");
  const [sheetOpen, setSheetOpen] = useState(false);

  const effPrice = (p: Product) => salePrice(p, minPrice(p));

  /* ---- category tree ---- */
  const catChildren = useMemo(() => {
    const m = new Map<string, Category[]>();
    db.categories.forEach((c) => {
      const k = c.parentId || "";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    });
    m.forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return m;
  }, [db.categories]);

  const descOf = useCallback(
    (id: string): string[] => {
      const out = [id];
      (catChildren.get(id) || []).forEach((c) => out.push(...descOf(c.id)));
      return out;
    },
    [catChildren]
  );

  // a selected category also matches all of its sub-categories
  const selectedCatSet = useMemo(() => {
    const s = new Set<string>();
    cats.forEach((id) => descOf(id).forEach((d) => s.add(d)));
    return s;
  }, [cats, descOf]);

  /* ---- progressive drill-down: only show sub-categories of an expanded node ---- */
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // expand the seeded category + all its ancestors so it's visible
    const s = new Set<string>();
    let cur: string | null | undefined = params.get("cat");
    while (cur) {
      s.add(cur);
      cur = db.categories.find((c) => c.id === cur)?.parentId || null;
    }
    return s;
  });

  const toggleCat = (c: Category) => {
    const wasSelected = cats.includes(c.id);
    setCats((s) => toggle(s, c.id));
    if ((catChildren.get(c.id) || []).length > 0) {
      // selecting a parent reveals its sub-categories; deselecting collapses
      setExpanded((s) => {
        const n = new Set(s);
        if (wasSelected) n.delete(c.id);
        else n.add(c.id);
        return n;
      });
    }
  };
  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const renderCatNodes = (parentId: string | null, depth: number): ReactNode[] =>
    (catChildren.get(parentId || "") || []).map((c) => {
      const hasKids = (catChildren.get(c.id) || []).length > 0;
      const isExp = expanded.has(c.id);
      const sel = cats.includes(c.id);
      return (
        <div key={c.id} className="cat-node">
          <div className={`cat-row-f${sel ? " sel" : ""}`} style={{ paddingLeft: 8 + depth * 14 }}>
            <button type="button" className="cat-pick" onClick={() => toggleCat(c)}>
              {depth === 0 && <span className="ci"><CategoryIcon id={c.id} /></span>}
              <span className="cn">{c.name}</span>
              {sel && <span className="ck" aria-hidden>✓</span>}
            </button>
            {hasKids && (
              <button
                type="button"
                className={`cat-exp${isExp ? " open" : ""}`}
                aria-label={isExp ? "ჩაკეცვა" : "გაშლა"}
                aria-expanded={isExp}
                onClick={() => toggleExpand(c.id)}
              >
                <ChevronDownIcon />
              </button>
            )}
          </div>
          {hasKids && isExp && renderCatNodes(c.id, depth + 1)}
        </div>
      );
    });


  const matches = (p: Product) => {
    if (p.visible === false) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    if (cats.length && !selectedCatSet.has(p.cat)) return false;
    if (sizes.length && !p.sizes.some((s) => sizes.includes(s.l))) return false;
    if (colors.length && !(p.colors || []).some((c) => colors.includes(c.n))) return false;
    if (status.includes("new") && !hasTag(p, "new")) return false;
    if (status.includes("sale") && !p.salePct) return false;
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
  }, [db.products, cats, brands, sizes, colors, status, q, sort]);

  /* ---- option pools ---- */
  const pool = useMemo(
    () =>
      db.products.filter(
        (p) =>
          (cats.length === 0 || selectedCatSet.has(p.cat)) &&
          (brands.length === 0 || brands.includes(p.brand))
      ),
    [db.products, cats, brands, selectedCatSet]
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
  status.forEach((s) => chips.push({ k: "status", v: s, label: STATUS_LABELS[s] }));
  if (q) chips.push({ k: "q", v: "", label: `„${q}“` });

  const removeChip = (k: string, v: string) => {
    if (k === "cats") setCats((s) => s.filter((x) => x !== v));
    else if (k === "brands") setBrands((s) => s.filter((x) => x !== v));
    else if (k === "sizes") setSizes((s) => s.filter((x) => x !== v));
    else if (k === "colors") setColors((s) => s.filter((x) => x !== v));
    else if (k === "status") setStatus((s) => s.filter((x) => x !== v));
  };
  const clearAll = () => {
    setCats([]); setBrands([]); setSizes([]); setColors([]); setStatus([]);
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
        <div className="fbody cat-tree">
          {renderCatNodes(null, 0)}
        </div>
      </details>

      <details className="fgroup" open>
        <summary>ბრენდი</summary>
        <div className="fbody">
          {db.brands.map((b) => {
            const logo = brandLogoSrc(b);
            return (
              <label className="frow brow" key={b.id}>
                <input type="checkbox" checked={brands.includes(b.id)} onChange={() => setBrands((s) => toggle(s, b.id))} />
                {logo && (
                  <span className="blogo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" />
                  </span>
                )}
                <span>{b.name}</span>
              </label>
            );
          })}
        </div>
      </details>

      {sizeOptions.length > 0 && (
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

      {colorOptions.length > 0 && (
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

      <details className="fgroup" open>
        <summary>სტატუსი</summary>
        <div className="fbody">
          {(["new", "sale"] as const).map((s) => (
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
