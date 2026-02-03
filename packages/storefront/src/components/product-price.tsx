"use client";

import { Package, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WarehouseInfo } from "@/lib/api";

interface ProductPriceProps {
  warehouse: WarehouseInfo | null;
}

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function ProductPrice({ warehouse }: ProductPriceProps) {
  if (!warehouse) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Select a warehouse to see price and availability
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Price</p>
        <p className="text-4xl font-bold tracking-tight">
          {formatPrice(warehouse.price, warehouse.currency_code)}
        </p>
      </div>

      {/* Stock Status */}
      <div className="flex flex-wrap gap-2">
        {warehouse.inventory_quantity > 0 ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
            <Package className="h-3 w-3 mr-1" />
            In Stock ({warehouse.inventory_quantity} available)
          </Badge>
        ) : warehouse.backorder_enabled ? (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Backorder Available
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Backorder Info */}
      {warehouse.backorder_enabled && warehouse.backorder_available_date && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Expected availability:{" "}
          <span className="font-medium text-foreground">
            {new Date(warehouse.backorder_available_date).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </span>
        </p>
      )}

      {/* Shipping Info */}
      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          Ships from{" "}
          <span className="font-medium text-foreground">
            {warehouse.location_name}
          </span>
        </p>
      </div>
    </div>
  );
}
