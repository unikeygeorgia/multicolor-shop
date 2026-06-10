"use client";

import Link from "next/link";

import { hasTag } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ProductGrid } from "@/components/product-grid";
import { Hero } from "@/components/home/hero";
import { PromoBanners } from "@/components/home/promo-banners";
import { TrustBand } from "@/components/home/trust-band";
import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ProBand } from "@/components/home/pro-band";

export default function HomePage() {
  const { db, settings } = useStore();
  const deals = db.products.filter((p) => p.salePct).slice(0, 4);
  const newArrivals = db.products.filter((p) => hasTag(p, "new")).slice(0, 4);

  return (
    <main className="wrap" data-screen-label="მთავარი გვერდი">
      <Hero />

      <PromoBanners />

      <TrustBand />

      {/* featured deals — only when prices are shown */}
      {!settings.pricesHidden && (
        <section className="section" aria-labelledby="deals-h">
          <div className="sec-head">
            <div>
              <span className="kicker">შეთავაზებები</span>
              <h2 id="deals-h">შერჩეული ფასდაკლებები</h2>
            </div>
            <Link className="more" href="/sale">
              ყველა ფასდაკლება →
            </Link>
          </div>
          <ProductGrid products={deals} />
        </section>
      )}

      {/* shop by brand */}
      <section className="section" aria-labelledby="brands-h">
        <div className="sec-head">
          <div>
            <span className="kicker">8 იმპორტირებული ბრენდი</span>
            <h2 id="brands-h">იყიდე ბრენდის მიხედვით</h2>
          </div>
        </div>
        <BrandStrip />
      </section>

      {/* new arrivals */}
      <section className="section" aria-labelledby="new-h">
        <div className="sec-head">
          <div>
            <span className="kicker">ახალი მარაგი</span>
            <h2 id="new-h">სიახლეები</h2>
          </div>
          <Link className="more" href="/shop?tag=new">
            ყველა სიახლე →
          </Link>
        </div>
        <ProductGrid products={newArrivals} />
      </section>

      {/* category tiles */}
      <section className="section" aria-labelledby="cats-h">
        <div className="sec-head">
          <div>
            <span className="kicker">კატალოგი</span>
            <h2 id="cats-h">კატეგორიები</h2>
          </div>
          <Link className="more" href="/shop">
            სრული კატალოგი →
          </Link>
        </div>
        <CategoryTiles />
      </section>

      <ProBand />
    </main>
  );
}
