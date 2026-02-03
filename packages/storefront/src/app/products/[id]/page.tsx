import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { ProductDetails } from "@/components/product-details";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  let data = null;
  let error = null;

  try {
    data = await getProduct(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load product";
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 max-w-md">
          <h3 className="font-semibold text-destructive mb-2">
            Unable to load product
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  return <ProductDetails data={data} />;
}
