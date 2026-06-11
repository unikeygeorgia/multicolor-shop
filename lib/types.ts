/* Domain types for the Multicolor storefront data model. */

export type CatGroupId = "paint" | "chem" | "tool";

export interface Brand {
  id: string;
  name: string;
  country: string;
  tint: string;
  tagline: string;
  story: string;
}

export interface Category {
  id: string;
  name: string;
  /** parent category id; null/undefined for a top-level category */
  parentId?: string | null;
  /** legacy group bucket — optional, no longer drives navigation */
  group?: CatGroupId | null;
  facets: string[];
  order: number;
  sub?: string[];
}

export interface CatGroup {
  id: CatGroupId;
  name: string;
}

export interface Surface {
  id: string;
  name: string;
}

export interface ProductSize {
  /** display label, e.g. "10კგ" (volumes) or "25მმ" (tool sizes) */
  l: string;
  /** price */
  p: number;
  /** stock */
  s: number;
  /** unit for volume variants (კგ/გრ/ლ/მლ/მგ/ც) — absent for tool sizes */
  u?: string;
  /** raw numeric value for volume variants (label = v + u) */
  v?: string;
}

export interface ProductColor {
  /** name */
  n: string;
  /** hex */
  h: string;
  ral?: string;
}

export interface ProductSpecs {
  surface?: string[];
  coverage?: string;
  drying?: string;
  base?: string;
}

export interface Product {
  id: string;
  brand: string;
  cat: string;
  name: string;
  /** short subtitle, e.g. "აბაზანისა & სამზარეულოს ჰიდროიზოლაცია" */
  subtitle?: string;
  /** auto-generated Latin slug from the (Georgian) name; used in the URL */
  slug?: string;
  desc: string;
  /** usage instructions (გამოყენების წესი) */
  usage?: string;
  /** extra info for the AI bot only — never shown on the storefront */
  aiInfo?: string;
  /** uploaded product photo URL */
  image?: string;
  /** uploaded document/PDF URL */
  document?: string;
  /** show this product on the website */
  visible?: boolean;
  /** include this product in the AI bot knowledge base */
  inAi?: boolean;
  sizes: ProductSize[];
  colors: ProductColor[];
  specs: ProductSpecs;
  tags: string[];
  featured?: boolean;
  salePct?: number;
}

/** Global storefront settings (settings table). */
export interface AppSettings {
  /** hide all prices on the storefront */
  pricesHidden: boolean;
  /** enable cart / checkout / accounts; when false the site is a catalog only */
  commerceEnabled: boolean;
}

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  sub: string;
  cta: string;
  link: string;
  tint: "paint" | "color" | "pro";
}

export interface Promotion {
  id: string;
  name: string;
  type: string;
  value: number;
  target: string;
  from: string;
  to: string;
  active: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  items: string[];
  note: string;
  price: number;
  oldPrice: number;
}

export interface OrderItem {
  pid: string;
  size: string;
  color?: string | null;
  qty: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  city: string;
  email?: string;
  address?: string;
  company?: string;
  note?: string;
}

export interface Order {
  id: string;
  type: "order" | "quote" | "inquiry";
  status: "new" | "processing" | "done" | "cancelled";
  date: string;
  customer: OrderCustomer;
  items: OrderItem[];
}

export interface MulticolorData {
  v: number;
  brands: Brand[];
  categories: Category[];
  catGroups: CatGroup[];
  surfaces: Surface[];
  products: Product[];
  hero: HeroSlide[];
  promotions: Promotion[];
  bundles: Bundle[];
  orders: Order[];
}

/** A line in the shopping cart. */
export interface CartLine {
  pid: string;
  size: string;
  color: string | null;
  qty: number;
}
