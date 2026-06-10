"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { fmt, hasTag, ph, salePrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { CartIcon } from "@/components/icons";

const GALLERY_SHOTS = ["ფოტო · ძირითადი", "ფოტო · შეფუთვა", "ფოტო · გამოყენება"];

export function ProductClient() {
  const { db, brandById, catById, surfName, addToCart, settings } = useStore();
  const params = useSearchParams();
  const key = params.get("slug") || params.get("id") || "";

  const p = useMemo(
    () => db.products.find((x) => x.slug === key || x.id === key) || db.products[0],
    [db.products, key]
  );
  const b = brandById(p.brand)!;
  const c = catById(p.cat)!;
  const { pricesHidden, commerceEnabled } = settings;

  const [size, setSize] = useState<string>(p.sizes[0]?.l ?? "");
  const [color, setColor] = useState<string | null>(p.colors && p.colors.length ? p.colors[0].n : null);
  const [shot, setShot] = useState(0);

  useEffect(() => {
    setSize(p.sizes[0]?.l ?? "");
    setColor(p.colors && p.colors.length ? p.colors[0].n : null);
    setShot(0);
    document.title = p.name + " — მულტიკოლორი";
  }, [p]);

  const curSize = p.sizes.find((s) => s.l === size) || p.sizes[0];
  const eff = curSize ? salePrice(p, curSize.p) : 0;
  const colorObj = p.colors.find((x) => x.n === color);

  const specRows: [string, string][] = [];
  if (p.specs.surface) specRows.push(["ზედაპირი", p.specs.surface.map(surfName).join(", ")]);
  if (p.specs.coverage) specRows.push(["ხარჯი", p.specs.coverage]);
  if (p.specs.drying) specRows.push(["შრობის დრო", p.specs.drying]);
  if (p.specs.base) specRows.push(["ფუძე", p.specs.base]);
  specRows.push(["ბრენდი", `${b.name} (${b.country})`]);
  specRows.push(["კატეგორია", c.name]);

  const related = db.products
    .filter((x) => x.id !== p.id && (x.cat === p.cat || x.brand === p.brand))
    .sort((a, z) => (z.cat === p.cat ? 1 : 0) - (a.cat === p.cat ? 1 : 0))
    .slice(0, 4);

  const add = () => addToCart(p.id, size, color, 1);

  return (
    <>
      <main className="wrap" id="pdp-root" data-screen-label="პროდუქტის გვერდი">
        <nav className="crumbs" aria-label="ნავიგაცია">
          <Link href="/">მთავარი</Link>
          <span className="sep">/</span>
          <Link href="/shop">კატალოგი</Link>
          <span className="sep">/</span>
          <Link href={`/shop?cat=${p.cat}`}>{c.name}</Link>
          <span className="sep">/</span>
          <span className="here">{p.name.split("—")[0].trim()}</span>
        </nav>

        <div className="pdp">
          <div className="gallery">
            <div className="main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="g-main" src={ph(GALLERY_SHOTS[shot], b.tint, 900, 900)} alt={`${p.name} — პროდუქტის ფოტო`} />
              <div className="badges">
                {hasTag(p, "new") && <span className="badge new">ახალი</span>}
                {p.salePct && !pricesHidden ? <span className="badge sale">−{p.salePct}%</span> : null}
              </div>
            </div>
            <div className="thumbs">
              {GALLERY_SHOTS.map((g, i) => (
                <button key={g} className={i === shot ? "on" : ""} aria-label={g} onClick={() => setShot(i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph(g, b.tint, 200, 200)} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="buy">
            <Link className="brandlink" href={`/brand?b=${b.id}`}>
              <span className="mark" style={{ background: b.tint }}>{b.name[0]}</span> {b.name} · {b.country}
            </Link>
            <h1>{p.name}</h1>
            <p className="lead">{p.desc || ""}</p>

            {p.sizes.length > 0 && (
              <div className="opt">
                <div className="opt-label">შეფუთვა / ზომა <span>— {size}</span></div>
                <div className="sizebtns">
                  {p.sizes.map((s) => (
                    <button
                      key={s.l}
                      className={`sizebtn${s.l === size ? " on" : ""}`}
                      onClick={() => setSize(s.l)}
                    >
                      {s.l}
                      {!pricesHidden && <small className="num">{fmt(salePrice(p, s.p))}</small>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.colors && p.colors.length > 0 && (
              <div className="opt">
                <div className="opt-label">
                  ფერი <span>— {color}{colorObj && colorObj.ral ? ` (${colorObj.ral})` : ""}</span>
                </div>
                <div className="swrow">
                  {p.colors.map((cl) => (
                    <button
                      key={cl.n}
                      className={`swatch${cl.n === color ? " on" : ""}`}
                      title={`${cl.n}${cl.ral ? " · " + cl.ral : ""}`}
                      aria-label={cl.n}
                      onClick={() => setColor(cl.n)}
                    >
                      <span style={{ background: cl.h }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!pricesHidden && curSize && (
              <div className="priceline">
                <span className={`big${p.salePct ? " sale" : ""}`}>{fmt(eff)}</span>
                {p.salePct ? (
                  <>
                    <span className="old">{fmt(curSize.p)}</span>
                    <span className="badge sale">−{p.salePct}%</span>
                  </>
                ) : null}
              </div>
            )}

            {commerceEnabled && (
              <div className="buyrow">
                <button className="btn lg" onClick={add}>
                  <CartIcon /> კალათაში დამატება
                </button>
                <Link className="btn-line lg" href={`/contact?type=bulk&p=${p.id}`}>ბითუმად შეთავაზება</Link>
              </div>
            )}
            <div className="quoterow">
              დაგაინტერესა? <Link href={`/contact?type=bulk&p=${p.id}`}>მოგვწერე ამ პროდუქტზე →</Link>
            </div>

            {p.usage && (
              <div className="specs">
                <h3>გამოყენების წესი</h3>
                <p style={{ fontSize: "14px", color: "var(--ink-soft)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {p.usage}
                </p>
              </div>
            )}

            <div className="specs">
              <h3>მახასიათებლები</h3>
              <table>
                <tbody>
                  {specRows.map((r) => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td>
                      <td>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <section className="section" aria-labelledby="rel-h">
          <div className="sec-head">
            <div>
              <span className="kicker">{c.name}</span>
              <h2 id="rel-h">მსგავსი პროდუქტები</h2>
            </div>
            <Link className="more" href={`/shop?cat=${p.cat}`}>კატეგორიის ნახვა →</Link>
          </div>
          <div className="pgrid">
            {related.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      </main>

      {commerceEnabled && (
        <div className="mob-buy">
          <div>
            {!pricesHidden && <div className={`p${p.salePct ? " sale" : ""}`}>{fmt(eff)}</div>}
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {size}{color ? " · " + color : ""}
            </div>
          </div>
          <button className="btn" onClick={add}>კალათაში დამატება</button>
        </div>
      )}
    </>
  );
}
