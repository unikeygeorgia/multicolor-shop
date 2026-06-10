"use client";

import Link from "next/link";

import { useStore } from "@/components/store-provider";
import { brandLogo } from "@/lib/brand-logos";

export function BrandStrip() {
  const { db } = useStore();
  return (
    <div className="brand-strip" id="brand-strip">
      {db.brands.map((b) => {
        const logo = brandLogo(b.id);
        return (
          <Link key={b.id} className="brand-tile" href={`/brand?b=${b.id}`}>
            {logo ? (
              <span className="brand-mark logo-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={b.name} />
              </span>
            ) : (
              <span className="brand-mark" style={{ background: b.tint }}>
                {b.name[0]}
              </span>
            )}
            <b>{b.name}</b>
            <span>{b.country}</span>
          </Link>
        );
      })}
    </div>
  );
}
