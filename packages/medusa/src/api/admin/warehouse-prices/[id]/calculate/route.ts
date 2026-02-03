import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import WarehousePricingService from "../../../../../modules/warehouse-pricing/service"
import { WAREHOUSE_PRICING_MODULE } from "../../../../../modules/warehouse-pricing"

// GET /admin/warehouse-prices/:id/calculate?quantity=X - Calculate effective price
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const quantity = parseInt(req.query.quantity as string, 10)

  if (isNaN(quantity) || quantity < 1) {
    res.status(400).json({ error: "quantity must be a positive integer" })
    return
  }

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  try {
    const result = await warehousePricingService.calculateEffectivePrice(
      id,
      quantity
    )
    res.json({
      quantity,
      unit_price: result.unit_price,
      total_price: result.unit_price * quantity,
      tier_applied: result.tier_applied,
      tier_name: result.tier_name,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate price" })
  }
}
