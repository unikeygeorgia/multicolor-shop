import { Suspense } from "react";
import { ProductClient } from "./product-client";

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "60vh" }} />}>
      <ProductClient />
    </Suspense>
  );
}
