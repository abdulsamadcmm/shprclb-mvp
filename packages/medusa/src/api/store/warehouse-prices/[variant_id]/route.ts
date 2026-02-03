import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import WarehousePricingService from "../../../../modules/warehouse-pricing/service"
import { WAREHOUSE_PRICING_MODULE } from "../../../../modules/warehouse-pricing"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { variant_id } = req.params
  const { location_id } = req.query

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  if (location_id && typeof location_id === "string") {
    // Get price for specific variant + location
    const price = await warehousePricingService.getByVariantAndLocation(
      variant_id,
      location_id
    )
    res.json({ warehouse_price: price })
  } else {
    // Get all prices for this variant across locations
    const prices = await warehousePricingService.getByVariant(variant_id)
    res.json({ warehouse_prices: prices })
  }
}
