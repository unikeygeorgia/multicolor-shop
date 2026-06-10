import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  cols = 4,
  className,
}: {
  products: Product[];
  cols?: 3 | 4;
  className?: string;
}) {
  return (
    <div className={cn("pgrid", cols === 3 && "cols-3", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
