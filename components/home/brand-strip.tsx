"use client";

import Link from "next/link";

import { useStore } from "@/components/store-provider";

export function BrandStrip() {
  const { db } = useStore();
  return (
    <div className="brand-strip" id="brand-strip">
      {db.brands.map((b) => (
        <Link key={b.id} className="brand-tile" href={`/brand?b=${b.id}`}>
          <span className="brand-mark" style={{ background: b.tint }}>
            {b.name[0]}
          </span>
          <b>{b.name}</b>
          <span>{b.country}</span>
        </Link>
      ))}
    </div>
  );
}
