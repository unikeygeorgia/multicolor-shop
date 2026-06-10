"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { minPrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { brandLogo } from "@/lib/brand-logos";
import { ProductCard } from "@/components/product-card";

export function BrandClient() {
  const { db, catById, brandById } = useStore();
  const params = useSearchParams();

  const b = useMemo(
    () => brandById(params.get("b") || "") || db.brands[0],
    [db.brands, params, brandById]
  );

  const prods = useMemo(() => db.products.filter((p) => p.brand === b.id), [db.products, b.id]);
  const cats = useMemo(
    () => [...new Set(prods.map((p) => p.cat))].map((id) => catById(id)).filter(Boolean),
    [prods, catById]
  );

  const [activeCat, setActiveCat] = useState("all");
  const [sort, setSort] = useState("pop");

  useEffect(() => {
    setActiveCat("all");
    document.title = b.name + " — მულტიკოლორი";
  }, [b]);

  const list = useMemo(() => {
    let l = prods.filter((p) => activeCat === "all" || p.cat === activeCat);
    if (sort === "asc") l = [...l].sort((a, z) => minPrice(a) - minPrice(z));
    if (sort === "desc") l = [...l].sort((a, z) => minPrice(z) - minPrice(a));
    return l;
  }, [prods, activeCat, sort]);

  return (
    <main className="wrap" id="brand-root" data-screen-label="ბრენდის გვერდი">
      <nav className="crumbs" aria-label="ნავიგაცია">
        <Link href="/">მთავარი</Link>
        <span className="sep">/</span>
        <span>ბრენდები</span>
        <span className="sep">/</span>
        <span className="here">{b.name}</span>
      </nav>

      <section
        className="bhero"
        style={{ background: `linear-gradient(120deg, ${b.tint}, color-mix(in oklab, ${b.tint} 72%, black))` }}
      >
        <div className="inner">
          {brandLogo(b.id) ? (
            <div className="mark logo-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandLogo(b.id)} alt={b.name} />
            </div>
          ) : (
            <div className="mark">{b.name[0]}</div>
          )}
          <h1>{b.name}</h1>
          <div className="tag">{b.tagline} · {b.country}</div>
          <p className="story">{b.story}</p>
          <div className="meta">
            <span>ოფიციალური იმპორტი</span>
            <span>{prods.length} პროდუქტი კატალოგში</span>
          </div>
        </div>
        <div className="spectrum-bar" />
      </section>

      <section className="section">
        <div className="sec-head">
          <div>
            <span className="kicker">{b.name}</span>
            <h2>ბრენდის პროდუქტები</h2>
          </div>
        </div>
        <div className="bfilter">
          <button
            className={`chip${activeCat === "all" ? " active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            ყველა
          </button>
          {cats.map((c) => (
            <button
              key={c!.id}
              className={`chip${activeCat === c!.id ? " active" : ""}`}
              onClick={() => setActiveCat(c!.id)}
            >
              {c!.name}
            </button>
          ))}
          <label className="sortbox">
            დალაგება
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="pop">პოპულარული</option>
              <option value="asc">ფასი: ზრდადობით</option>
              <option value="desc">ფასი: კლებადობით</option>
            </select>
          </label>
        </div>
        {list.length > 0 ? (
          <div className="pgrid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>ამ კატეგორიაში პროდუქტი ვერ მოიძებნა</h3>
          </div>
        )}
      </section>

      <section className="section">
        <div className="sec-head">
          <div>
            <span className="kicker">აღმოაჩინე მეტი</span>
            <h2>სხვა ბრენდები</h2>
          </div>
        </div>
        <div className="other-brands">
          {db.brands.filter((x) => x.id !== b.id).map((x) => (
            <Link key={x.id} className="ob" href={`/brand?b=${x.id}`}>
              <span className="mk" style={{ background: x.tint }}>{x.name[0]}</span>
              {x.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
