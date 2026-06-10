"use client";

/**
 * Backwards-compat shim. The cart now lives in the unified store
 * (see components/store-provider.tsx). Kept so any stray imports
 * keep resolving; prefer importing { useStore, StoreProvider } directly.
 */
export { StoreProvider as CartProvider, useStore as useCart } from "@/components/store-provider";
