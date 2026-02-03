import { MedusaService } from "@medusajs/framework/utils"
import WarehousePrice from "./models/warehouse-price"
import PricingTier from "./models/pricing-tier"

class WarehousePricingService extends MedusaService({
  WarehousePrice,
  PricingTier,
}) {
  async getByVariantAndLocation(variantId: string, locationId: string) {
    const [price] = await this.listWarehousePrices({
      variant_id: variantId,
      location_id: locationId,
    })
    return price || null
  }

  async getByVariant(variantId: string) {
    return this.listWarehousePrices({
      variant_id: variantId,
    })
  }

  async getByLocation(locationId: string) {
    return this.listWarehousePrices({
      location_id: locationId,
    })
  }

  async upsertWarehousePrice(data: {
    variant_id: string
    location_id: string
    base_price: number
    currency_code?: string
    backorder_enabled?: boolean
    backorder_available_date?: Date | null
  }) {
    const existing = await this.getByVariantAndLocation(
      data.variant_id,
      data.location_id
    )

    if (existing) {
      // Delete and recreate for simplicity (MedusaService update can be tricky)
      await this.deleteWarehousePrices([existing.id])
      const [created] = await this.createWarehousePrices([data])
      return created
    }

    const [created] = await this.createWarehousePrices([data])
    return created
  }

  // Pricing Tier Methods

  async getTiersByWarehousePrice(warehousePriceId: string) {
    const tiers = await this.listPricingTiers({
      warehouse_price_id: warehousePriceId,
    })
    // Sort by min_quantity ascending
    return tiers.sort((a, b) => a.min_quantity - b.min_quantity)
  }

  async upsertPricingTiers(
    warehousePriceId: string,
    tiers: Array<{
      min_quantity: number
      max_quantity: number | null
      unit_price: number
    }>
  ) {
    // Delete existing tiers for this warehouse price
    const existingTiers = await this.listPricingTiers({
      warehouse_price_id: warehousePriceId,
    })

    if (existingTiers.length > 0) {
      await this.deletePricingTiers(existingTiers.map((t) => t.id))
    }

    // Create new tiers
    if (tiers.length === 0) {
      return []
    }

    const tiersToCreate = tiers.map((tier) => ({
      warehouse_price_id: warehousePriceId,
      min_quantity: tier.min_quantity,
      max_quantity: tier.max_quantity,
      unit_price: tier.unit_price,
    }))

    return this.createPricingTiers(tiersToCreate)
  }

  async calculateEffectivePrice(
    warehousePriceId: string,
    quantity: number
  ): Promise<{ unit_price: number; tier_applied: boolean; tier_name: string }> {
    // Get the warehouse price for base price
    const [warehousePrice] = await this.listWarehousePrices({
      id: warehousePriceId,
    })

    if (!warehousePrice) {
      throw new Error("Warehouse price not found")
    }

    // Get tiers
    const tiers = await this.getTiersByWarehousePrice(warehousePriceId)

    if (tiers.length === 0) {
      return {
        unit_price: warehousePrice.base_price,
        tier_applied: false,
        tier_name: "Base Price",
      }
    }

    // Find applicable tier
    for (const tier of tiers) {
      const minOk = quantity >= tier.min_quantity
      const maxOk = tier.max_quantity === null || quantity <= tier.max_quantity

      if (minOk && maxOk) {
        const tierName =
          tier.max_quantity === null
            ? `${tier.min_quantity}+ units`
            : `${tier.min_quantity}-${tier.max_quantity} units`

        return {
          unit_price: tier.unit_price,
          tier_applied: true,
          tier_name: tierName,
        }
      }
    }

    // No tier matched, use base price
    return {
      unit_price: warehousePrice.base_price,
      tier_applied: false,
      tier_name: "Base Price",
    }
  }
}

export default WarehousePricingService
