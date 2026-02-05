"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartLineItem } from "@/contexts/cart-context";
import { calculateCartLineItem } from "@/lib/api";

interface CartLineItemProps {
  item: CartLineItem;
  onRemove: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPricingUpdate: (
    itemId: string,
    pricing: {
      unit_price: number;
      total_price: number;
      tier_applied: boolean;
      tier_name: string;
    }
  ) => void;
}

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function CartLineItemComponent({
  item,
  onRemove,
  onQuantityChange,
  onPricingUpdate,
}: CartLineItemProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Recalculate pricing when quantity changes
  useEffect(() => {
    const recalculatePrice = async () => {
      if (localQuantity === item.quantity) return;

      setIsCalculating(true);
      try {
        const pricing = await calculateCartLineItem(
          item.warehouse_price_id,
          localQuantity
        );

        onPricingUpdate(item.id, {
          unit_price: pricing.unit_price,
          total_price: pricing.total_price,
          tier_applied: pricing.tier_applied,
          tier_name: pricing.tier_name,
        });

        onQuantityChange(item.id, localQuantity);
      } catch (error) {
        console.error("Failed to recalculate price:", error);
        // Revert to previous quantity on error
        setLocalQuantity(item.quantity);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce the recalculation
    const timer = setTimeout(recalculatePrice, 500);
    return () => clearTimeout(timer);
  }, [localQuantity]);

  const handleDecrease = () => {
    if (localQuantity > 1) {
      setLocalQuantity(localQuantity - 1);
    }
  };

  const handleIncrease = () => {
    setLocalQuantity(localQuantity + 1);
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      setLocalQuantity(num);
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.product_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 space-y-2">
        <div className="space-y-1">
          <h3 className="font-medium leading-tight">{item.product_title}</h3>
          <p className="text-sm text-muted-foreground">
            {item.variant_title}
            {item.variant_sku && (
              <span className="ml-2 text-xs">SKU: {item.variant_sku}</span>
            )}
          </p>
        </div>

        {/* Warehouse & Tier Info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {item.location_name}
          </Badge>
          {item.tier_applied && (
            <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Tag className="h-3 w-3 mr-1" />
              {item.tier_name}
            </Badge>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleDecrease}
            disabled={localQuantity <= 1 || isCalculating}
          >
            -
          </Button>
          <input
            type="number"
            min="1"
            value={localQuantity}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isCalculating}
            className="w-16 h-8 text-center border rounded-md text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleIncrease}
            disabled={isCalculating}
          >
            +
          </Button>
          {isCalculating && (
            <span className="text-xs text-muted-foreground">
              Calculating...
            </span>
          )}
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-right">
          <p className="font-semibold">
            {formatPrice(item.total_price, item.currency_code)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(item.unit_price, item.currency_code)} each
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
