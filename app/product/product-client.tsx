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
  const { db, brandById, catById, surfName, addToCart } = useStore();
  const params = useSearchParams();

  const p = useMemo(
    () => db.products.find((x) => x.id === params.get("id")) || db.products[0],
    [db.products, params]
  );
  const b = brandById(p.brand)!;
  const c = catById(p.cat)!;

  const [size, setSize] = useState<string>(
    (p.sizes.find((s) => s.s > 0) || p.sizes[0]).l
  );
  const [color, setColor] = useState<string | null>(
    p.colors && p.colors.length ? p.colors[0].n : null
  );
  const [shot, setShot] = useState(0);

  /* reset selection if the product changes */
  useEffect(() => {
    setSize((p.sizes.find((s) => s.s > 0) || p.sizes[0]).l);
    setColor(p.colors && p.colors.length ? p.colors[0].n : null);
    setShot(0);
    document.title = p.name + " — მულტიკოლორი";
  }, [p]);

  const curSize = p.sizes.find((s) => s.l === size) || p.sizes[0];
  const eff = salePrice(p, curSize.p);
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
  const outOfStock = curSize.s <= 0;

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
              <img
                id="g-main"
                src={ph(GALLERY_SHOTS[shot], b.tint, 900, 900)}
                alt={`${p.name} — პროდუქტის ფოტო`}
              />
              <div className="badges">
                {hasTag(p, "new") && <span className="badge new">ახალი</span>}
                {p.salePct ? <span className="badge sale">−{p.salePct}%</span> : null}
              </div>
            </div>
            <div className="thumbs">
              {GALLERY_SHOTS.map((g, i) => (
                <button
                  key={g}
                  className={i === shot ? "on" : ""}
                  aria-label={g}
                  onClick={() => setShot(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph(g, b.tint, 200, 200)} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="buy">
            <Link className="brandlink" href={`/brand?b=${b.id}`}>
              <span className="mark" style={{ background: b.tint }}>{b.name[0]}</span>{" "}
              {b.name} · {b.country}
            </Link>
            <h1>{p.name}</h1>
            <p className="lead">{p.desc || ""}</p>

            <div className="opt">
              <div className="opt-label">შეფუთვა <span>— {size}</span></div>
              <div className="sizebtns">
                {p.sizes.map((s) => (
                  <button
                    key={s.l}
                    className={`sizebtn${s.l === size ? " on" : ""}${s.s <= 0 ? " out" : ""}`}
                    onClick={() => setSize(s.l)}
                  >
                    {s.l}
                    <small className="num">{fmt(salePrice(p, s.p))}</small>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="priceline">
              <span className={`big${p.salePct ? " sale" : ""}`}>{fmt(eff)}</span>
              {p.salePct ? (
                <>
                  <span className="old">{fmt(curSize.p)}</span>
                  <span className="badge sale">−{p.salePct}%</span>
                </>
              ) : null}
            </div>
            <div className={`stockline ${outOfStock ? "out" : curSize.s <= 10 ? "low" : "ok"}`}>
              {outOfStock
                ? "ამოიწურა — შეუკვეთეთ წინასწარ"
                : curSize.s <= 10
                ? `მარაგი იწურება — დარჩა ${curSize.s} ც`
                : `✓ მარაგშია — ${curSize.s} ც`}
            </div>

            <div className="buyrow">
              <button className="btn lg" disabled={outOfStock} onClick={add}>
                <CartIcon /> კალათაში დამატება
              </button>
              <Link className="btn-line lg" href={`/contact?type=bulk&p=${p.id}`}>
                ბითუმად შეთავაზება
              </Link>
            </div>
            <div className="quoterow">
              პროფესიონალი ხარ?{" "}
              <Link href={`/contact?type=bulk&p=${p.id}`}>მოითხოვე ობიექტის ფასი →</Link>
            </div>

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

      <div className="mob-buy">
        <div>
          <div className={`p${p.salePct ? " sale" : ""}`}>{fmt(eff)}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            {size}{color ? " · " + color : ""}
          </div>
        </div>
        <button className="btn" disabled={outOfStock} onClick={add}>
          კალათაში დამატება
        </button>
      </div>
    </>
  );
}
