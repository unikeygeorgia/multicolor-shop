import { Suspense } from "react";
import { ShopClient } from "./shop-client";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "60vh" }} />}>
      <ShopClient />
    </Suspense>
  );
}
