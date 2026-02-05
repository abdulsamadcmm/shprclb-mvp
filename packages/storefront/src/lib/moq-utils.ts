import { PricingTier } from "./api";

/**
 * Calculate the Minimum Order Quantity (MOQ) from pricing tiers.
 * MOQ is the lowest min_quantity across all tiers, defaulting to 1 if no tiers exist.
 */
export function getMOQ(pricingTiers: PricingTier[]): number {
  if (!pricingTiers || pricingTiers.length === 0) {
    return 1;
  }
  
  const minQuantities = pricingTiers.map(tier => tier.min_quantity);
  return Math.min(...minQuantities);
}

/**
 * Get tiers that represent actual discounts (above the MOQ).
 * The tier at MOQ is considered base price, not a discount.
 */
export function getDiscountTiers(pricingTiers: PricingTier[], moq: number): PricingTier[] {
  return pricingTiers.filter(tier => tier.min_quantity > moq);
}

/**
 * Check if a quantity equals the MOQ (at base price, no discount).
 */
export function isAtMOQ(quantity: number, moq: number): boolean {
  return quantity === moq;
}

/**
 * Check if a quantity is above MOQ (potentially qualifies for discounts).
 */
export function isAboveMOQ(quantity: number, moq: number): boolean {
  return quantity > moq;
}

/**
 * Check if a quantity meets the MOQ requirement.
 */
export function meetsMOQ(quantity: number, moq: number): boolean {
  return quantity >= moq;
}
