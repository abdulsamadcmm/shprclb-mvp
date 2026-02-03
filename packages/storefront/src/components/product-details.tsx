"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WarehouseSelector } from "./warehouse-selector";
import { ProductPrice } from "./product-price";
import { ProductWithWarehousePricing, WarehouseInfo } from "@/lib/api";

interface ProductDetailsProps {
  data: ProductWithWarehousePricing;
}

export function ProductDetails({ data }: ProductDetailsProps) {
  const { product, variants } = data;
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseInfo | null>(null);

  // Auto-select first warehouse when variant changes
  useEffect(() => {
    if (selectedVariant?.warehouses.length > 0) {
      setSelectedWarehouse(selectedVariant.warehouses[0]);
    } else {
      setSelectedWarehouse(null);
    }
  }, [selectedVariant]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to products
      </Link>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {product.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || "No description available"}
            </p>
          </div>

          <Separator />

          {/* Variant Selector */}
          {variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Variant</label>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedVariant?.id === variant.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/50"
                    }`}
                  >
                    {variant.title}
                    {variant.sku && (
                      <span className="ml-1.5 text-xs opacity-70">
                        ({variant.sku})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warehouse Selector */}
          {selectedVariant && (
            <WarehouseSelector
              warehouses={selectedVariant.warehouses}
              selectedWarehouse={selectedWarehouse}
              onSelect={setSelectedWarehouse}
            />
          )}

          <Separator />

          {/* Price Display */}
          <ProductPrice warehouse={selectedWarehouse} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              disabled={!selectedWarehouse}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-4">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Additional Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm">
              <span className="font-medium">SKU:</span>{" "}
              <span className="text-muted-foreground">
                {selectedVariant?.sku || "N/A"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Variants:</span>{" "}
              <span className="text-muted-foreground">{variants.length}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Available at:</span>{" "}
              <span className="text-muted-foreground">
                {selectedVariant?.warehouses.length || 0} warehouse
                {(selectedVariant?.warehouses.length || 0) !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
