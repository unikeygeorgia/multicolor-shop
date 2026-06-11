/* Real partner brand logos (vendored in /public/brand-logos).
   Light-background-friendly versions; rendered inside a white box. */

export const BRAND_LOGOS: Record<string, string> = {
  sobsan: "/brand-logos/sobsan.svg",
  premium: "/brand-logos/premium.png",
  starbond: "/brand-logos/starbond.png",
  bauer: "/brand-logos/bauer.svg",
  teirani: "/brand-logos/teirani.svg",
  asmako: "/brand-logos/asmako.svg",
  stargil: "/brand-logos/stargil.svg",
  proian: "/brand-logos/proian.svg",
};

export function brandLogo(id: string): string | undefined {
  return BRAND_LOGOS[id];
}

/** Prefer the brand's uploaded logo, falling back to the vendored one by id. */
export function brandLogoSrc(b: { id: string; logo?: string | null }): string | undefined {
  return b.logo || BRAND_LOGOS[b.id];
}
