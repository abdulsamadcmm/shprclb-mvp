import { MedusaService } from "@medusajs/framework/utils"
import WarehousePrice from "./models/warehouse-price"

class WarehousePricingService extends MedusaService({
  WarehousePrice,
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
}

export default WarehousePricingService
