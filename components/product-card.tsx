"use client";

import Link from "next/link";

import type { Product } from "@/lib/types";
import { fmt, hasTag, inStock, minPrice, prodImg, salePrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { PlusIcon } from "@/components/icons";

export function ProductCard({ product: p }: { product: Product }) {
  const { brandById, quickAdd } = useStore();
  const b = brandById(p.brand);
  const base = minPrice(p);
  const onSale = !!p.salePct;
  const colors = (p.colors || []).slice(0, 5);
  const extra = (p.colors || []).length - colors.length;
  const sizes = p.sizes.slice(0, 4);

  return (
    <article className="pcard" data-pid={p.id}>
      <div className="ph">
        <Link href={`/product?id=${p.id}`} aria-label={p.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prodImg(p, b)} alt={`${p.name} — პროდუქტის ფოტო`} loading="lazy" />
        </Link>
        <div className="badges">
          {hasTag(p, "new") && <span className="badge new">ახალი</span>}
          {onSale && <span className="badge sale">−{p.salePct}%</span>}
          {!inStock(p) && <span className="badge soft">ამოიწურა</span>}
        </div>
        <button
          className="quick"
          aria-label="სწრაფად დამატება კალათაში"
          title="კალათაში დამატება"
          onClick={() => quickAdd(p.id)}
        >
          <PlusIcon />
        </button>
      </div>
      <div className="info">
        <Link className="brandchip" href={`/brand?b=${p.brand}`}>
          {b ? b.name : ""}
        </Link>
        <h3>
          <Link href={`/product?id=${p.id}`}>{p.name}</Link>
        </h3>
        {colors.length > 0 && (
          <div className="swatches">
            {colors.map((c, i) => (
              <span
                key={`${c.n}-${i}`}
                className="dot"
                style={{ background: c.h }}
                title={c.n}
              />
            ))}
            {extra > 0 && <span className="dot more">+{extra}</span>}
          </div>
        )}
        <div className="sizes">
          {sizes.map((s, i) => (
            <span key={`${s.l}-${i}`} className="size-pill">
              {s.l}
            </span>
          ))}
          {p.sizes.length > 4 && (
            <span className="size-pill">+{p.sizes.length - 4}</span>
          )}
        </div>
        <div className="pricebar">
          {p.sizes.length > 1 && <span className="price-from">დან</span>}
          <span className={`price${onSale ? " sale" : ""}`}>
            {fmt(salePrice(p, base))}
          </span>
          {onSale && <span className="price-old">{fmt(base)}</span>}
        </div>
      </div>
    </article>
  );
}
