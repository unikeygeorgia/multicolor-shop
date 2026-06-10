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

import { prodById } from "@/lib/data";
import type { CartLine } from "@/lib/types";

const CART_KEY = "mc_cart_v1";

interface ToastItem {
  id: number;
  node: ReactNode;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  addToCart: (pid: string, size: string, color?: string | null, qty?: number) => void;
  quickAdd: (pid: string) => void;
  toast: (node: ReactNode) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  /* hydrate from localStorage after mount (avoids SSR mismatch) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toast = useCallback((node: ReactNode) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, node }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const addToCart = useCallback(
    (pid: string, size: string, color: string | null = null, qty = 1) => {
      const next = lines.map((l) => ({ ...l }));
      const hit = next.find((i) => i.pid === pid && i.size === size && i.color === color);
      if (hit) hit.qty += qty;
      else next.push({ pid, size, color: color || null, qty });
      persist(next);
      const p = prodById(pid);
      toast(
        <>
          <span className="tick">✓</span> დაემატა კალათას —{" "}
          {p ? p.name.split("—")[0].trim() : ""} <Link href="/cart">კალათა</Link>
        </>
      );
    },
    [lines, persist, toast]
  );

  const quickAdd = useCallback(
    (pid: string) => {
      const p = prodById(pid);
      if (!p) return;
      const sz = p.sizes.find((s) => s.s > 0) || p.sizes[0];
      addToCart(pid, sz.l, p.colors && p.colors.length ? p.colors[0].n : null, 1);
    },
    [addToCart]
  );

  const count = useMemo(() => lines.reduce((a, i) => a + i.qty, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({ lines, count, addToCart, quickAdd, toast }),
    [lines, count, addToCart, quickAdd, toast]
  );

  return (
    <CartContext.Provider value={value}>
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
    </CartContext.Provider>
  );
}
