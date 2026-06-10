import Link from "next/link";

import { MC_DATA } from "@/lib/data";

export function BrandStrip() {
  return (
    <div className="brand-strip" id="brand-strip">
      {MC_DATA.brands.map((b) => (
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
