import { getProducts, getCategories, ProductWithWarehousePricing } from "@/lib/api";
import { ProductGrid } from "@/components/products";
import Link from "next/link";
import { X } from "lucide-react";

interface HomeProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const categoryId = params.category;

  let products: ProductWithWarehousePricing[] = [];
  let categoryName: string | null = null;
  let error: string | null = null;

  try {
    // Fetch products (filtered by category if specified)
    products = await getProducts(categoryId);

    // If filtering by category, get the category name for display
    if (categoryId) {
      const categories = await getCategories();
      const activeCategory = categories.find((c) => c.id === categoryId);
      categoryName = activeCategory?.name || null;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  const pageTitle = categoryName || "All Products";
  const pageDescription = categoryName
    ? `Browse ${categoryName.toLowerCase()} with warehouse-specific pricing`
    : "Browse our collection with warehouse-specific pricing";

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          {categoryId && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filter
            </Link>
          )}
        </div>
        <p className="text-muted-foreground">{pageDescription}</p>
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
        <>
          {products.length === 0 && categoryName ? (
            <div className="rounded-lg border bg-muted/50 p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No products found in {categoryName}.
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all products
              </Link>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </>
      )}
    </div>
  );
}
