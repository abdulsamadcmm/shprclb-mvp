"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, Heart, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WarehouseSelector } from "./warehouse-selector";
import { ProductPrice } from "./product-price";
import { QuantityPricing } from "./quantity-pricing";
import { DesignUpload, type DesignInfo } from "./product/design-upload";
import { ProductWithWarehousePricing, WarehouseInfo, calculateCartLineItem } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";
import { getMOQ, meetsMOQ } from "@/lib/moq-utils";

interface ProductDetailsProps {
  data: ProductWithWarehousePricing;
}

export function ProductDetails({ data }: ProductDetailsProps) {
  const { product, variants } = data;
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseInfo | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customDesign, setCustomDesign] = useState<DesignInfo | null>(null);
  const { addItem } = useCart();

  // Auto-select first warehouse when variant changes
  useEffect(() => {
    if (selectedVariant?.warehouses.length > 0) {
      const warehouse = selectedVariant.warehouses[0];
      setSelectedWarehouse(warehouse);
      // Set quantity to MOQ when variant changes
      const moq = getMOQ(warehouse.pricing_tiers);
      setQuantity(moq);
    } else {
      setSelectedWarehouse(null);
      setQuantity(1);
    }
  }, [selectedVariant]);

  // Reset quantity to MOQ when warehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      const moq = getMOQ(selectedWarehouse.pricing_tiers);
      setQuantity(moq);
    }
  }, [selectedWarehouse]);

  // Check if warehouse has pricing tiers
  const hasPricingTiers = (selectedWarehouse?.pricing_tiers?.length ?? 0) > 0;
  
  // Calculate MOQ for current warehouse
  const moq = selectedWarehouse ? getMOQ(selectedWarehouse.pricing_tiers) : 1;
  const meetsMinimum = meetsMOQ(quantity, moq);

  const handleAddToCart = async () => {
    if (!selectedWarehouse || !selectedVariant) return;

    setIsAdding(true);
    try {
      // Calculate price with tiers
      const pricing = await calculateCartLineItem(
        selectedWarehouse.warehouse_price_id,
        quantity
      );

      // Add to cart
      addItem({
        variant_id: selectedVariant.id,
        warehouse_price_id: selectedWarehouse.warehouse_price_id,
        location_id: selectedWarehouse.location_id,
        location_name: selectedWarehouse.location_name,
        quantity,
        product_title: product.title,
        variant_title: selectedVariant.title,
        variant_sku: selectedVariant.sku,
        thumbnail: selectedVariant.thumbnail || product.thumbnail,
        unit_price: pricing.unit_price,
        total_price: pricing.total_price,
        currency_code: selectedWarehouse.currency_code,
        tier_applied: pricing.tier_applied,
        tier_name: pricing.tier_name,
        moq,
        custom_design: customDesign ? {
          file_url: customDesign.file_url,
          file_id: customDesign.file_id,
          placement: customDesign.placement,
          file_name: customDesign.file_name,
        } : undefined,
      });

      // Clear design after adding to cart
      setCustomDesign(null);

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

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
            {(selectedVariant?.thumbnail || product.thumbnail) ? (
              <img
                src={selectedVariant?.thumbnail || product.thumbnail}
                alt={selectedVariant ? `${product.title} - ${selectedVariant.title}` : product.title}
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

          {/* Custom Design Upload */}
          <DesignUpload
            onDesignChange={setCustomDesign}
            initialDesign={null}
            disabled={!selectedWarehouse}
            productImage={selectedVariant?.thumbnail || product.thumbnail}
          />

          <Separator />

          {/* Price Display - Show Quantity Pricing if tiers exist, otherwise basic price */}
          {selectedWarehouse ? (
            hasPricingTiers ? (
              <QuantityPricing
                warehouse={selectedWarehouse}
                quantity={quantity}
                onQuantityChange={setQuantity}
                moq={moq}
              />
            ) : (
              <>
                {/* Basic quantity selector for warehouses without tiers */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(moq, quantity - 1))}
                      disabled={quantity <= moq}
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      min={moq}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= moq) {
                          setQuantity(val);
                        }
                      }}
                      className="w-16 h-10 text-center border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  {moq > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Minimum order: {moq} units
                    </p>
                  )}
                </div>
                <ProductPrice warehouse={selectedWarehouse} />
              </>
            )
          ) : (
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <p className="text-muted-foreground">
                Select a warehouse to see price and availability
              </p>
            </div>
          )}

          {/* MOQ Warning */}
          {selectedWarehouse && !meetsMinimum && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">
                Minimum order quantity is {moq} units. Please increase the quantity to add to cart.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              disabled={!selectedWarehouse || isAdding || !meetsMinimum}
              onClick={handleAddToCart}
            >
              {showSuccess ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAdding ? "Adding..." : `Add to Cart ${quantity > 1 ? `(${quantity})` : ""}`}
                </>
              )}
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
            {(selectedWarehouse?.pricing_tiers?.length ?? 0) > 0 && (
              <p className="text-sm">
                <span className="font-medium">Volume Discounts:</span>{" "}
                <span className="text-emerald-600">
                  {selectedWarehouse?.pricing_tiers?.length} tier
                  {(selectedWarehouse?.pricing_tiers?.length ?? 0) !== 1 ? "s" : ""} available
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
