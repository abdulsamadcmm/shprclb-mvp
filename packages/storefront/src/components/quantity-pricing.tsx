"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingTier, WarehouseInfo } from "@/lib/api";

interface QuantityPricingProps {
  warehouse: WarehouseInfo;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

function getTierForQuantity(
  tiers: PricingTier[],
  quantity: number,
  basePrice: number
): { price: number; tierName: string; tierApplied: boolean } {
  // Sort tiers by min_quantity
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

  for (const tier of sortedTiers) {
    const minOk = quantity >= tier.min_quantity;
    const maxOk = tier.max_quantity === null || quantity <= tier.max_quantity;

    if (minOk && maxOk) {
      const tierName =
        tier.max_quantity === null
          ? `${tier.min_quantity}+ units`
          : `${tier.min_quantity}-${tier.max_quantity} units`;
      return { price: tier.unit_price, tierName, tierApplied: true };
    }
  }

  return { price: basePrice, tierName: "Base Price", tierApplied: false };
}

function calculateSavings(
  basePrice: number,
  tierPrice: number,
  quantity: number
): number {
  return (basePrice - tierPrice) * quantity;
}

export function QuantityPricing({
  warehouse,
  quantity,
  onQuantityChange,
}: QuantityPricingProps) {
  const { pricing_tiers, price: basePrice, currency_code } = warehouse;
  const hasTiers = pricing_tiers.length > 0;

  const { price: currentUnitPrice, tierName, tierApplied } = getTierForQuantity(
    pricing_tiers,
    quantity,
    basePrice
  );

  const totalPrice = currentUnitPrice * quantity;
  const savings = tierApplied ? calculateSavings(basePrice, currentUnitPrice, quantity) : 0;

  // Find next tier threshold
  const sortedTiers = [...pricing_tiers].sort(
    (a, b) => a.min_quantity - b.min_quantity
  );
  const nextTier = sortedTiers.find((t) => t.min_quantity > quantity);

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                  onQuantityChange(val);
                }
              }}
              className="w-16 h-10 text-center border-x bg-transparent focus:outline-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {tierApplied && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Tag className="h-3 w-3 mr-1" />
              {tierName}
            </Badge>
          )}
        </div>
      </div>

      {/* Price Display */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Unit Price</span>
          <div className="text-right">
            <span className="text-lg font-semibold">
              {formatPrice(currentUnitPrice, currency_code)}
            </span>
            {tierApplied && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {formatPrice(basePrice, currency_code)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="text-sm font-medium">Total ({quantity} items)</span>
          <span className="text-2xl font-bold">
            {formatPrice(totalPrice, currency_code)}
          </span>
        </div>

        {savings > 0 && (
          <p className="text-sm text-emerald-600 font-medium">
            You save {formatPrice(savings, currency_code)}!
          </p>
        )}
      </div>

      {/* Next Tier Hint */}
      {nextTier && (
        <p className="text-sm text-muted-foreground">
          Buy {nextTier.min_quantity - quantity} more to get{" "}
          <span className="font-medium text-foreground">
            {formatPrice(nextTier.unit_price, currency_code)}/unit
          </span>
        </p>
      )}

      {/* Pricing Tiers Table */}
      {hasTiers && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Volume Pricing</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Quantity</th>
                  <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                  <th className="px-3 py-2 text-right font-medium">Discount</th>
                </tr>
              </thead>
              <tbody>
                {/* Base price row */}
                <tr
                  className={`border-t ${
                    !tierApplied ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">1 unit</td>
                  <td className="px-3 py-2 text-right">
                    {formatPrice(basePrice, currency_code)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">—</td>
                </tr>
                {/* Tier rows */}
                {sortedTiers.map((tier, idx) => {
                  const discount = Math.round(
                    ((basePrice - tier.unit_price) / basePrice) * 100
                  );
                  const isActive =
                    quantity >= tier.min_quantity &&
                    (tier.max_quantity === null || quantity <= tier.max_quantity);

                  return (
                    <tr
                      key={idx}
                      className={`border-t ${isActive ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {tier.max_quantity === null
                          ? `${tier.min_quantity}+ units`
                          : `${tier.min_quantity}-${tier.max_quantity} units`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatPrice(tier.unit_price, currency_code)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-600">
                        {discount > 0 ? `-${discount}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
