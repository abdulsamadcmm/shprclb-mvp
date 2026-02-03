"use client";

import { Minus, Plus, Tag, TrendingDown, ArrowRight } from "lucide-react";
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

function formatDiscount(basePrice: number, tierPrice: number): string {
  const discountPercent = ((basePrice - tierPrice) / basePrice) * 100;
  return discountPercent.toFixed(1);
}

function getTierForQuantity(
  tiers: PricingTier[],
  quantity: number,
  basePrice: number
): { price: number; tierName: string; tierApplied: boolean; discountPercent: number } {
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

  for (const tier of sortedTiers) {
    const minOk = quantity >= tier.min_quantity;
    const maxOk = tier.max_quantity === null || quantity <= tier.max_quantity;

    if (minOk && maxOk) {
      const tierName =
        tier.max_quantity === null
          ? `${tier.min_quantity}+ units`
          : `${tier.min_quantity}-${tier.max_quantity} units`;
      const discountPercent = ((basePrice - tier.unit_price) / basePrice) * 100;
      return { price: tier.unit_price, tierName, tierApplied: true, discountPercent };
    }
  }

  return { price: basePrice, tierName: "Base Price", tierApplied: false, discountPercent: 0 };
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

  const { price: currentUnitPrice, tierName, tierApplied, discountPercent } = getTierForQuantity(
    pricing_tiers,
    quantity,
    basePrice
  );

  const totalPrice = currentUnitPrice * quantity;
  const savings = tierApplied ? calculateSavings(basePrice, currentUnitPrice, quantity) : 0;
  const pricePerUnitSaved = tierApplied ? basePrice - currentUnitPrice : 0;

  // Sort tiers for display
  const sortedTiers = [...pricing_tiers].sort(
    (a, b) => a.min_quantity - b.min_quantity
  );
  
  // Find next tier threshold
  const nextTier = sortedTiers.find((t) => t.min_quantity > quantity);
  const nextTierDiscount = nextTier 
    ? ((basePrice - nextTier.unit_price) / basePrice) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Pricing Tiers Banner - Always visible when tiers exist */}
      {hasTiers && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">
              Volume Discounts Available
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedTiers.map((tier, idx) => {
              const discount = formatDiscount(basePrice, tier.unit_price);
              const isActive =
                quantity >= tier.min_quantity &&
                (tier.max_quantity === null || quantity <= tier.max_quantity);
              
              return (
                <Badge
                  key={idx}
                  variant={isActive ? "default" : "outline"}
                  className={`text-xs ${
                    isActive 
                      ? "bg-emerald-600 hover:bg-emerald-600" 
                      : "border-emerald-300 text-emerald-700"
                  }`}
                >
                  {tier.min_quantity}+ units: {discount}% off
                </Badge>
              );
            })}
          </div>
        </div>
      )}

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
              {discountPercent.toFixed(1)}% off
            </Badge>
          )}
        </div>
      </div>

      {/* Price Display */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Unit Price</span>
          <div className="text-right flex items-baseline gap-2">
            <span className="text-lg font-semibold">
              {formatPrice(currentUnitPrice, currency_code)}
            </span>
            {tierApplied && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(basePrice, currency_code)}
                </span>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                  Save {formatPrice(pricePerUnitSaved, currency_code)}/unit
                </Badge>
              </>
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
          <div className="flex items-center justify-between bg-emerald-50 rounded-md px-3 py-2">
            <span className="text-sm text-emerald-700">Your Savings</span>
            <span className="text-sm font-bold text-emerald-700">
              {formatPrice(savings, currency_code)} ({discountPercent.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Next Tier Call-to-Action */}
      {nextTier && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Add {nextTier.min_quantity - quantity} more to unlock {nextTierDiscount.toFixed(1)}% discount
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Price drops from {formatPrice(currentUnitPrice, currency_code)} to{" "}
                <span className="font-semibold">{formatPrice(nextTier.unit_price, currency_code)}</span>/unit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Pricing Tiers Table */}
      {hasTiers && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Volume Pricing Breakdown</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Quantity</th>
                  <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                  <th className="px-3 py-2 text-right font-medium">You Save</th>
                  <th className="px-3 py-2 text-right font-medium">Discount</th>
                </tr>
              </thead>
              <tbody>
                {/* Base price row */}
                <tr
                  className={`border-t ${
                    !tierApplied ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    1-{sortedTiers.length > 0 ? sortedTiers[0].min_quantity - 1 : 1} units
                    {!tierApplied && <span className="ml-2 text-xs text-muted-foreground">(current)</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPrice(basePrice, currency_code)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">—</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">—</td>
                </tr>
                {/* Tier rows */}
                {sortedTiers.map((tier, idx) => {
                  const discount = ((basePrice - tier.unit_price) / basePrice) * 100;
                  const savedPerUnit = basePrice - tier.unit_price;
                  const isActive =
                    quantity >= tier.min_quantity &&
                    (tier.max_quantity === null || quantity <= tier.max_quantity);

                  return (
                    <tr
                      key={idx}
                      className={`border-t ${isActive ? "bg-emerald-50 font-medium" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {tier.max_quantity === null
                          ? `${tier.min_quantity}+ units`
                          : `${tier.min_quantity}-${tier.max_quantity} units`}
                        {isActive && <span className="ml-2 text-xs text-emerald-600">(current)</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPrice(tier.unit_price, currency_code)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-600">
                        {formatPrice(savedPerUnit, currency_code)}/unit
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${isActive ? "bg-emerald-200 text-emerald-800" : "bg-muted"}`}
                        >
                          {discount.toFixed(1)}% off
                        </Badge>
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
