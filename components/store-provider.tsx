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
import type {
  Brand,
  Category,
  CartLine,
  MulticolorData,
  Order,
  Product,
} from "@/lib/types";

const DB_KEY = "mc_db_v3";
const CART_KEY = "mc_cart_v1";
const ORDERS_KEY = "mc_orders_v1";

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : (JSON.parse(JSON.stringify(v)) as T);
}

interface ToastItem {
  id: number;
  node: ReactNode;
}

interface StoreValue {
  hydrated: boolean;
  db: MulticolorData;
  /** Mutate a draft of the DB; persisted to localStorage + re-rendered. */
  mutateDb: (fn: (draft: MulticolorData) => void) => void;
  resetDb: () => void;

  /* lookups (bound to live db) */
  brandById: (id: string) => Brand | undefined;
  catById: (id: string) => Category | undefined;
  prodById: (id: string) => Product | undefined;
  surfName: (id: string) => string;

  /* cart */
  cart: CartLine[];
  count: number;
  addToCart: (pid: string, size: string, color?: string | null, qty?: number) => void;
  quickAdd: (pid: string) => void;
  addBundle: (productIds: string[]) => void;
  updateCartQty: (index: number, delta: number) => void;
  removeCartLine: (index: number) => void;
  clearCart: () => void;

  /* orders */
  orders: Order[];
  pushOrder: (o: Order) => void;
  setOrderStatus: (id: string, status: Order["status"]) => void;

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
  const [cart, setCart] = useState<CartLine[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  /* ---------- hydrate from localStorage after mount ---------- */
  useEffect(() => {
    try {
      const rawDb = localStorage.getItem(DB_KEY);
      if (rawDb) {
        const parsed = JSON.parse(rawDb) as MulticolorData;
        if (parsed && parsed.v === MC_DATA.v) setDb(parsed);
      }
    } catch {
      /* ignore */
    }
    try {
      const rawCart = localStorage.getItem(CART_KEY);
      if (rawCart) setCart(JSON.parse(rawCart) as CartLine[]);
    } catch {
      /* ignore */
    }
    try {
      const rawOrders = localStorage.getItem(ORDERS_KEY);
      if (rawOrders) setUserOrders(JSON.parse(rawOrders) as Order[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  /* ---------- persistence helpers ---------- */
  const persistCart = useCallback((next: CartLine[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const persistUserOrders = useCallback((next: Order[]) => {
    setUserOrders(next);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const mutateDb = useCallback((fn: (draft: MulticolorData) => void) => {
    setDb((prev) => {
      const next = clone(prev);
      fn(next);
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const resetDb = useCallback(() => {
    try {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(ORDERS_KEY);
    } catch {
      /* ignore */
    }
    setDb(MC_DATA);
    setUserOrders([]);
  }, []);

  /* ---------- toast ---------- */
  const toast = useCallback((node: ReactNode) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, node }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* ---------- lookups ---------- */
  const brandById = useCallback((id: string) => db.brands.find((b) => b.id === id), [db]);
  const catById = useCallback((id: string) => db.categories.find((c) => c.id === id), [db]);
  const prodById = useCallback((id: string) => db.products.find((p) => p.id === id), [db]);
  const surfName = useCallback(
    (id: string) => {
      const s = db.surfaces.find((x) => x.id === id);
      return s ? s.name : id;
    },
    [db]
  );

  /* ---------- cart ---------- */
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
          <span className="tick">✓</span> ნაკრები დაემატა კალათას{" "}
          <Link href="/cart">კალათა</Link>
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
    (index: number) => {
      const next = cart.filter((_, i) => i !== index);
      persistCart(next);
    },
    [cart, persistCart]
  );

  const clearCart = useCallback(() => persistCart([]), [persistCart]);

  const count = useMemo(() => cart.reduce((a, i) => a + i.qty, 0), [cart]);

  /* ---------- orders (user orders first, then seed) ---------- */
  const orders = useMemo<Order[]>(
    () =>
      [...userOrders, ...db.orders].sort((a, b) => b.date.localeCompare(a.date)),
    [userOrders, db.orders]
  );

  const pushOrder = useCallback(
    (o: Order) => {
      persistUserOrders([o, ...userOrders]);
    },
    [userOrders, persistUserOrders]
  );

  const setOrderStatus = useCallback(
    (id: string, status: Order["status"]) => {
      const inUser = userOrders.some((o) => o.id === id);
      if (inUser) {
        persistUserOrders(userOrders.map((o) => (o.id === id ? { ...o, status } : o)));
      } else {
        mutateDb((draft) => {
          const seed = draft.orders.find((o) => o.id === id);
          if (seed) seed.status = status;
        });
      }
    },
    [userOrders, persistUserOrders, mutateDb]
  );

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      db,
      mutateDb,
      resetDb,
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
      toast,
    }),
    [
      hydrated,
      db,
      mutateDb,
      resetDb,
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
      toast,
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
