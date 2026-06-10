"use client";

import Link from "next/link";

import { fmt, prodImg } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";

export default function SalePage() {
  const { db, brandById, prodById, addBundle } = useStore();
  const sale = db.products.filter((p) => p.salePct);

  return (
    <main className="wrap" data-screen-label="ფასდაკლების გვერდი">
      <section className="sale-hero">
        <span className="badge sale">მოქმედებს ივნისში</span>
        <h1>ფასდაკლებები და ნაკრებები</h1>
        <p>
          შერჩეული პროდუქტები შემცირებულ ფასად და მზა ნაკრებები, რომლებშიც
          ყველაფერი ერთადაა — საღებავიდან ლენტამდე.
        </p>
        <div className="spectrum-bar" />
      </section>

      <section className="section">
        <div className="sec-head">
          <div>
            <span className="kicker">−10% — −25%</span>
            <h2>ფასდაკლებული პროდუქტები</h2>
          </div>
          <span className="rmeta" style={{ fontSize: 13, color: "var(--muted)" }}>
            <b className="num">{sale.length}</b> პროდუქტი
          </span>
        </div>
        <div className="pgrid">
          {sale.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-head">
          <div>
            <span className="kicker">იყიდე ერთად — დაზოგე</span>
            <h2>მზა ნაკრებები</h2>
          </div>
        </div>
        <div className="bundles">
          {db.bundles.map((bd) => (
            <article className="bundle" key={bd.id}>
              <h3>{bd.name}</h3>
              <div className="items">
                {bd.items.slice(0, 4).map((pid) => {
                  const p = prodById(pid);
                  if (!p) return null;
                  return (
                    <Link key={pid} href={`/product?id=${p.id}`} title={p.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prodImg(p, brandById(p.brand), 160, 160)} alt={p.name} />
                    </Link>
                  );
                })}
              </div>
              <div className="note">{bd.note}</div>
              <div className="pricebar">
                <span className="price sale">{fmt(bd.price)}</span>
                <span className="price-old">{fmt(bd.oldPrice)}</span>
                <span className="saveline">დაზოგე {fmt(bd.oldPrice - bd.price)}</span>
              </div>
              <button className="btn" onClick={() => addBundle(bd.items)}>
                ნაკრების დამატება კალათაში
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
