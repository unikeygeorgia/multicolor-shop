import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

interface Banner {
  kicker: string;
  title: string;
  cta: string;
  href: string;
  deco: string;
  alt?: boolean;
}

const BANNERS: Banner[] = [
  {
    kicker: "შეთავაზებები",
    title: "შერჩეული მასალები — სპეციალურ ფასად",
    cta: "ნახე მეტი",
    href: "/shop",
    deco: "%",
  },
  {
    kicker: "ახალი მარაგი",
    title: "ახალი ჩამოსვლები კატალოგში",
    cta: "იხილე ახალი",
    href: "/shop?tag=new",
    deco: "★",
    alt: true,
  },
];

export function PromoBanners() {
  return (
    <section className="promo-banners" aria-label="შეთავაზებები">
      {BANNERS.map((b) => (
        <Link key={b.title} href={b.href} className={`promo-banner${b.alt ? " alt" : ""}`}>
          <div className="pb-body">
            <span className="pb-kicker">{b.kicker}</span>
            <h3>{b.title}</h3>
            <span className="pb-cta">
              {b.cta} <ArrowRightIcon />
            </span>
          </div>
          <span className="pb-deco" aria-hidden="true">{b.deco}</span>
        </Link>
      ))}
    </section>
  );
}
