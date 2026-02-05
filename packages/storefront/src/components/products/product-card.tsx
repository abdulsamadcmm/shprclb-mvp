import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductWithWarehousePricing } from "@/lib/api";
import { getMOQ } from "@/lib/moq-utils";
import { Info } from "lucide-react";

interface ProductCardProps {
  data: ProductWithWarehousePricing;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(cents / 100);
}

export function ProductCard({ data }: ProductCardProps) {
  const { product, variants } = data;

  // Get min/max price across all warehouses
  const allPrices = variants.flatMap((v) => v.warehouses.map((w) => w.price));
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;
  const warehouseCount = new Set(
    variants.flatMap((v) => v.warehouses.map((w) => w.location_id))
  ).size;

  // Calculate highest MOQ across all warehouses
  const moqValues = variants.flatMap((v) =>
    v.warehouses.map((w) => getMOQ(w.pricing_tiers))
  );
  const maxMOQ = moqValues.length > 0 ? Math.max(...moqValues) : 1;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden border-0 shadow-none hover:shadow-lg transition-all duration-300 bg-card">
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-muted">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description || "No description available"}
          </p>

          {/* Price */}
          <div className="space-y-1">
            {minPrice !== null ? (
              <p className="text-lg font-bold">
                {minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} - ${formatPrice(maxPrice!)}`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Price unavailable</p>
            )}
          </div>

          {/* MOQ & Warehouse Info */}
          <div className="flex flex-wrap gap-2 pt-1">
            {maxMOQ > 1 && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs">
                <Info className="h-3 w-3 mr-1" />
                Min. Order: {maxMOQ} units
              </Badge>
            )}
            {warehouseCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {warehouseCount} location{warehouseCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
