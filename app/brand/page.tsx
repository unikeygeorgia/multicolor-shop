import { Suspense } from "react";
import { BrandClient } from "./brand-client";

export default function BrandPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "60vh" }} />}>
      <BrandClient />
    </Suspense>
  );
}
