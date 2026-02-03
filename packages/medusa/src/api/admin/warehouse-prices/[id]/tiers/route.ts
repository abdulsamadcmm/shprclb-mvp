import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import WarehousePricingService from "../../../../../modules/warehouse-pricing/service"
import { WAREHOUSE_PRICING_MODULE } from "../../../../../modules/warehouse-pricing"

// GET /admin/warehouse-prices/:id/tiers - List pricing tiers for a warehouse price
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  try {
    const tiers = await warehousePricingService.getTiersByWarehousePrice(id)
    res.json({ pricing_tiers: tiers })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pricing tiers" })
  }
}

// POST /admin/warehouse-prices/:id/tiers - Create/replace pricing tiers
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const { tiers } = req.body as {
    tiers: Array<{
      min_quantity: number
      max_quantity: number | null
      unit_price: number
    }>
  }

  if (!Array.isArray(tiers)) {
    res.status(400).json({ error: "tiers must be an array" })
    return
  }

  // Validate tiers
  for (const tier of tiers) {
    if (typeof tier.min_quantity !== "number" || tier.min_quantity < 1) {
      res.status(400).json({ error: "min_quantity must be a positive number" })
      return
    }
    if (
      tier.max_quantity !== null &&
      (typeof tier.max_quantity !== "number" || tier.max_quantity < tier.min_quantity)
    ) {
      res.status(400).json({
        error: "max_quantity must be null or >= min_quantity",
      })
      return
    }
    if (typeof tier.unit_price !== "number" || tier.unit_price < 0) {
      res.status(400).json({ error: "unit_price must be a non-negative number" })
      return
    }
  }

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  try {
    const createdTiers = await warehousePricingService.upsertPricingTiers(
      id,
      tiers
    )
    res.json({ pricing_tiers: createdTiers })
  } catch (error) {
    res.status(500).json({ error: "Failed to save pricing tiers" })
  }
}
