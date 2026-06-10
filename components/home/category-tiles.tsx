"use client";

import Link from "next/link";

import { ph } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import { ArrowRightIcon } from "@/components/icons";

const PICKS = [
  "paints-we",
  "lacquers",
  "waterproof",
  "foam",
  "sealants",
  "aerosols",
  "drills",
  "rollers",
];

export function CategoryTiles() {
  const { catById } = useStore();
  return (
    <div className="cat-tiles" id="cat-tiles">
      {PICKS.map((id) => {
        const c = catById(id);
        if (!c) return null;
        return (
          <Link key={id} className="cat-tile" href={`/shop?cat=${id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ph("ფოტო · " + c.name, "#46698c", 640, 480)} alt={c.name} />
            <span className="lbl">
              {c.name}
              <ArrowRightIcon />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
