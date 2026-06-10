"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

import { MC_DATA } from "@/lib/data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  categoryToRow,
  heroToRow,
  productToRow,
  promotionToRow,
  rowToBundle,
  rowToCategory,
  rowToHero,
  rowToOrder,
  rowToProduct,
  rowToPromotion,
} from "@/lib/mappers";
import type {
  AppSettings,
  Brand,
  CartLine,
  CatGroup,
  Category,
  HeroSlide,
  MulticolorData,
  Order,
  Product,
  Promotion,
  Surface,
} from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = { pricesHidden: true, commerceEnabled: false };

const CART_KEY = "mc_cart_v1";

function clone<T>(v: T): T {
  return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

/** Stable display order matching the original seed sequence. */
function orderBySeed<T extends { id: string }>(rows: T[], seed: { id: string }[]): T[] {
  const idx = new Map(seed.map((s, i) => [s.id, i]));
  return [...rows].sort((a, b) => (idx.get(a.id) ?? 9999) - (idx.get(b.id) ?? 9999));
}

/** Apply a promotion's effect to a product (pure) — mirrors the admin logic. */
function applyPromoToProduct(p: Product, x: Promotion): Product {
  const next = clone(p);
  if (x.active && x.type === "pct") {
    next.salePct = x.value;
    if (!next.tags.includes("sale")) next.tags = [...next.tags, "sale"];
  } else if (x.active && x.type === "fix") {
    const base = Math.min(...next.sizes.map((s) => s.p));
    next.salePct = Math.min(90, Math.round((x.value / base) * 100));
    if (!next.tags.includes("sale")) next.tags = [...next.tags, "sale"];
  } else {
    next.salePct = undefined;
    next.tags = next.tags.filter((t) => t !== "sale");
  }
  return next;
}

interface ToastItem {
  id: number;
  node: ReactNode;
}

interface StoreValue {
  hydrated: boolean;
  usingSupabase: boolean;
  db: MulticolorData;
  settings: AppSettings;
  updateSetting: (key: "prices_hidden" | "commerce_enabled", value: boolean) => void;

  brandById: (id: string) => Brand | undefined;
  catById: (id: string) => Category | undefined;
  prodById: (id: string) => Product | undefined;
  surfName: (id: string) => string;

  cart: CartLine[];
  count: number;
  addToCart: (pid: string, size: string, color?: string | null, qty?: number) => void;
  quickAdd: (pid: string) => void;
  addBundle: (productIds: string[]) => void;
  updateCartQty: (index: number, delta: number) => void;
  removeCartLine: (index: number) => void;
  clearCart: () => void;

  orders: Order[];
  pushOrder: (o: Order) => void;
  setOrderStatus: (id: string, status: Order["status"]) => void;

  /* admin write-through */
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertBrand: (b: Brand) => void;
  deleteBrand: (id: string) => void;
  updateCategory: (c: Category) => void;
  savePromotion: (x: Promotion, oldTarget?: string) => void;
  deletePromotion: (x: Promotion) => void;
  togglePromotion: (id: string, active: boolean) => void;
  updateHero: (index: number, slide: HeroSlide) => void;
  reload: () => void;

  toast: (node: ReactNode) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [db, setDb] = useState<MulticolorData>(MC_DATA);
  const [orders, setOrders] = useState<Order[]>(MC_DATA.orders);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((node: ReactNode) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, node }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* ---------- load catalogue from Supabase ---------- */
  const loadFromSupabase = useCallback(async () => {
    if (!supabase) return;
    try {
      const [brands, catGroups, surfaces, categories, products, promotions, bundles, hero, ord, sett] =
        await Promise.all([
          supabase.from("brands").select("*"),
          supabase.from("cat_groups").select("*"),
          supabase.from("surfaces").select("*"),
          supabase.from("categories").select("*").order("order"),
          supabase.from("products").select("*"),
          supabase.from("promotions").select("*"),
          supabase.from("bundles").select("*"),
          supabase.from("hero_slides").select("*").order("order"),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("settings").select("*"),
        ]);

      // settings load independently of catalogue
      if (sett.data) {
        const m: Record<string, unknown> = {};
        sett.data.forEach((r: { key: string; value: unknown }) => { m[r.key] = r.value; });
        setSettings({
          pricesHidden: m["prices_hidden"] === undefined ? true : Boolean(m["prices_hidden"]),
          commerceEnabled: m["commerce_enabled"] === undefined ? false : Boolean(m["commerce_enabled"]),
        });
      }

      if (products.error || brands.error) {
        console.error("Supabase load error", products.error || brands.error);
        return; // keep seed fallback
      }

      const next: MulticolorData = {
        v: MC_DATA.v,
        brands: orderBySeed((brands.data || []) as Brand[], MC_DATA.brands),
        catGroups: orderBySeed((catGroups.data || []) as CatGroup[], MC_DATA.catGroups),
        surfaces: orderBySeed((surfaces.data || []) as Surface[], MC_DATA.surfaces),
        categories: (categories.data || []).map(rowToCategory),
        products: orderBySeed((products.data || []).map(rowToProduct), MC_DATA.products),
        promotions: orderBySeed((promotions.data || []).map(rowToPromotion), MC_DATA.promotions),
        bundles: orderBySeed((bundles.data || []).map(rowToBundle), MC_DATA.bundles),
        hero: (hero.data || []).map(rowToHero),
        orders: [],
      };
      // guard against empty tables (unseeded project) — keep seed
      if (next.products.length === 0) return;

      setDb(next);
      setOrders((ord.data || []).map(rowToOrder));
    } catch (e) {
      console.error("Supabase load failed", e);
    }
  }, []);

  useEffect(() => {
    try {
      const rawCart = localStorage.getItem(CART_KEY);
      if (rawCart) setCart(JSON.parse(rawCart) as CartLine[]);
    } catch {
      /* ignore */
    }
    (async () => {
      if (isSupabaseConfigured) await loadFromSupabase();
      setHydrated(true);
    })();
  }, [loadFromSupabase]);

  /* ---------- cart (localStorage) ---------- */
  const persistCart = useCallback((next: CartLine[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const brandById = useCallback((id: string) => db.brands.find((b) => b.id === id), [db]);
  const catById = useCallback((id: string) => db.categories.find((c) => c.id === id), [db]);
  const prodById = useCallback((id: string) => db.products.find((p) => p.id === id), [db]);
  const surfName = useCallback(
    (id: string) => db.surfaces.find((x) => x.id === id)?.name ?? id,
    [db]
  );

  const addToCart = useCallback(
    (pid: string, size: string, color: string | null = null, qty = 1) => {
      const next = cart.map((l) => ({ ...l }));
      const hit = next.find((i) => i.pid === pid && i.size === size && i.color === color);
      if (hit) hit.qty += qty;
      else next.push({ pid, size, color: color || null, qty });
      persistCart(next);
      const p = prodById(pid);
      toast(
        <>
          <span className="tick">✓</span> დაემატა კალათას —{" "}
          {p ? p.name.split("—")[0].trim() : ""} <Link href="/cart">კალათა</Link>
        </>
      );
    },
    [cart, persistCart, prodById, toast]
  );
  const quickAdd = useCallback(
    (pid: string) => {
      const p = prodById(pid);
      if (!p) return;
      const sz = p.sizes.find((s) => s.s > 0) || p.sizes[0];
      addToCart(pid, sz.l, p.colors && p.colors.length ? p.colors[0].n : null, 1);
    },
    [prodById, addToCart]
  );
  const addBundle = useCallback(
    (productIds: string[]) => {
      const next = cart.map((l) => ({ ...l }));
      productIds.forEach((pid) => {
        const p = prodById(pid);
        if (!p) return;
        const sz = p.sizes.find((s) => s.s > 0) || p.sizes[0];
        const color = p.colors && p.colors.length ? p.colors[0].n : null;
        const hit = next.find((i) => i.pid === pid && i.size === sz.l && i.color === color);
        if (hit) hit.qty += 1;
        else next.push({ pid, size: sz.l, color, qty: 1 });
      });
      persistCart(next);
      toast(
        <>
          <span className="tick">✓</span> ნაკრები დაემატა კალათას <Link href="/cart">კალათა</Link>
        </>
      );
    },
    [cart, persistCart, prodById, toast]
  );
  const updateCartQty = useCallback(
    (index: number, delta: number) => {
      const next = cart.map((l) => ({ ...l }));
      if (!next[index]) return;
      next[index].qty = Math.max(1, next[index].qty + delta);
      persistCart(next);
    },
    [cart, persistCart]
  );
  const removeCartLine = useCallback(
    (index: number) => persistCart(cart.filter((_, i) => i !== index)),
    [cart, persistCart]
  );
  const clearCart = useCallback(() => persistCart([]), [persistCart]);
  const count = useMemo(() => cart.reduce((a, i) => a + i.qty, 0), [cart]);

  /* ---------- orders ---------- */
  // Orders are created server-side via /api/orders (service role). This only
  // updates local state for any optimistic UI that still calls it.
  const pushOrder = useCallback((o: Order) => {
    setOrders((prev) => [o, ...prev]);
  }, []);

  const setOrderStatus = useCallback((id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (supabase) supabase.from("orders").update({ status }).eq("id", id).then(({ error }) => {
      if (error) console.error("order status update failed", error);
    });
  }, []);

  /* ---------- admin write-through ---------- */
  const upsertProductRow = useCallback((p: Product) => {
    if (supabase) supabase.from("products").upsert(productToRow(p)).then(({ error }) => {
      if (error) console.error("product upsert failed", error);
    });
  }, []);

  const upsertProduct = useCallback((p: Product) => {
    setDb((prev) => {
      const next = clone(prev);
      const idx = next.products.findIndex((x) => x.id === p.id);
      if (idx >= 0) next.products[idx] = p;
      else next.products.unshift(p);
      return next;
    });
    upsertProductRow(p);
  }, [upsertProductRow]);

  const deleteProduct = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
    if (supabase) supabase.from("products").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("product delete failed", error);
    });
  }, []);

  const upsertBrand = useCallback((b: Brand) => {
    setDb((prev) => {
      const next = clone(prev);
      const idx = next.brands.findIndex((x) => x.id === b.id);
      if (idx >= 0) next.brands[idx] = b;
      else next.brands.push(b);
      return next;
    });
    if (supabase) supabase.from("brands").upsert(b).then(({ error }) => {
      if (error) console.error("brand upsert failed", error);
    });
  }, []);

  const deleteBrand = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, brands: prev.brands.filter((b) => b.id !== id) }));
    if (supabase) supabase.from("brands").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("brand delete failed", error);
    });
  }, []);

  const updateCategory = useCallback((c: Category) => {
    setDb((prev) => {
      const next = clone(prev);
      const idx = next.categories.findIndex((x) => x.id === c.id);
      if (idx >= 0) next.categories[idx] = c;
      return next;
    });
    if (supabase) supabase.from("categories").upsert(categoryToRow(c)).then(({ error }) => {
      if (error) console.error("category upsert failed", error);
    });
  }, []);

  const savePromotion = useCallback(
    (x: Promotion, oldTarget?: string) => {
      setDb((prev) => {
        const next = clone(prev);
        // clear old target if it changed
        if (oldTarget && oldTarget !== x.target) {
          const op = next.products.find((p) => p.id === oldTarget);
          if (op) {
            op.salePct = undefined;
            op.tags = op.tags.filter((t) => t !== "sale");
            upsertProductRow(op);
          }
        }
        const tp = next.products.find((p) => p.id === x.target);
        if (tp) {
          const updated = applyPromoToProduct(tp, x);
          Object.assign(tp, updated);
          upsertProductRow(tp);
        }
        const idx = next.promotions.findIndex((q) => q.id === x.id);
        if (idx >= 0) next.promotions[idx] = x;
        else next.promotions.unshift(x);
        return next;
      });
      if (supabase) supabase.from("promotions").upsert(promotionToRow(x)).then(({ error }) => {
        if (error) console.error("promotion upsert failed", error);
      });
    },
    [upsertProductRow]
  );

  const deletePromotion = useCallback(
    (x: Promotion) => {
      setDb((prev) => {
        const next = clone(prev);
        const op = next.products.find((p) => p.id === x.target);
        if (op) {
          op.salePct = undefined;
          op.tags = op.tags.filter((t) => t !== "sale");
          upsertProductRow(op);
        }
        next.promotions = next.promotions.filter((q) => q.id !== x.id);
        return next;
      });
      if (supabase) supabase.from("promotions").delete().eq("id", x.id).then(({ error }) => {
        if (error) console.error("promotion delete failed", error);
      });
    },
    [upsertProductRow]
  );

  const togglePromotion = useCallback(
    (id: string, active: boolean) => {
      setDb((prev) => {
        const next = clone(prev);
        const x = next.promotions.find((q) => q.id === id);
        if (!x) return prev;
        x.active = active;
        const tp = next.products.find((p) => p.id === x.target);
        if (tp) {
          Object.assign(tp, applyPromoToProduct(tp, x));
          upsertProductRow(tp);
        }
        if (supabase) supabase.from("promotions").update({ active }).eq("id", id).then(({ error }) => {
          if (error) console.error("promotion toggle failed", error);
        });
        return next;
      });
    },
    [upsertProductRow]
  );

  const updateHero = useCallback((index: number, slide: HeroSlide) => {
    setDb((prev) => {
      const next = clone(prev);
      next.hero[index] = slide;
      return next;
    });
    if (supabase) supabase.from("hero_slides").upsert(heroToRow(slide, index)).then(({ error }) => {
      if (error) console.error("hero upsert failed", error);
    });
  }, []);

  const reload = useCallback(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const updateSetting = useCallback(
    (key: "prices_hidden" | "commerce_enabled", value: boolean) => {
      setSettings((prev) =>
        key === "prices_hidden" ? { ...prev, pricesHidden: value } : { ...prev, commerceEnabled: value }
      );
      if (supabase)
        supabase
          .from("settings")
          .upsert({ key, value, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) console.error("setting update failed", error);
          });
    },
    []
  );

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      usingSupabase: isSupabaseConfigured,
      db,
      settings,
      updateSetting,
      brandById,
      catById,
      prodById,
      surfName,
      cart,
      count,
      addToCart,
      quickAdd,
      addBundle,
      updateCartQty,
      removeCartLine,
      clearCart,
      orders,
      pushOrder,
      setOrderStatus,
      upsertProduct,
      deleteProduct,
      upsertBrand,
      deleteBrand,
      updateCategory,
      savePromotion,
      deletePromotion,
      togglePromotion,
      updateHero,
      reload,
      toast,
    }),
    [
      hydrated, db, settings, updateSetting, brandById, catById, prodById, surfName, cart, count,
      addToCart, quickAdd, addBundle, updateCartQty, removeCartLine, clearCart,
      orders, pushOrder, setOrderStatus, upsertProduct, deleteProduct, upsertBrand,
      deleteBrand, updateCategory, savePromotion, deletePromotion, togglePromotion,
      updateHero, reload, toast,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div className="toast" key={t.id}>
              {t.node}
            </div>
          ))}
        </div>
      )}
    </StoreContext.Provider>
  );
}
