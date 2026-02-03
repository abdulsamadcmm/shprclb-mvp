import { getProducts, ProductWithWarehousePricing } from "@/lib/api";
import { ProductGrid } from "@/components/products";

export default async function Home() {
  let products: ProductWithWarehousePricing[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
        <p className="text-muted-foreground">
          Browse our collection with warehouse-specific pricing
        </p>
      </div>

      {/* Error State */}
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive mb-2">
            Unable to load products
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Make sure the BFF (port 3001) and Medusa (port 9000) services are
            running.
          </p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
