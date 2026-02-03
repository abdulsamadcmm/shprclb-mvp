import { ProductWithWarehousePricing } from "@/lib/api";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: ProductWithWarehousePricing[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create products in the{" "}
          <a
            href="http://localhost:9000/app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Medusa Admin
          </a>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((data) => (
        <ProductCard key={data.product.id} data={data} />
      ))}
    </div>
  );
}
