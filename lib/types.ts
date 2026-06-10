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
  group: CatGroupId;
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
  /** label, e.g. "10კგ" */
  l: string;
  /** price */
  p: number;
  /** stock */
  s: number;
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
  desc: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  specs: ProductSpecs;
  tags: string[];
  featured?: boolean;
  salePct?: number;
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
  color?: string;
  qty: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  city: string;
  address?: string;
  company?: string;
  note?: string;
}

export interface Order {
  id: string;
  type: "order" | "quote";
  status: "new" | "processing" | "done";
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
