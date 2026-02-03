import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import WarehousePricingService from "../../../modules/warehouse-pricing/service"
import { WAREHOUSE_PRICING_MODULE } from "../../../modules/warehouse-pricing"

// GET /admin/warehouse-prices - List all warehouse prices
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { variant_id, location_id } = req.query

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  const filters: Record<string, string> = {}
  if (variant_id && typeof variant_id === "string") {
    filters.variant_id = variant_id
  }
  if (location_id && typeof location_id === "string") {
    filters.location_id = location_id
  }

  const prices = await warehousePricingService.listWarehousePrices(filters)
  res.json({ warehouse_prices: prices })
}

// POST /admin/warehouse-prices - Create or update a warehouse price
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const {
    variant_id,
    location_id,
    base_price,
    currency_code,
    backorder_enabled,
    backorder_available_date,
  } = req.body as {
    variant_id: string
    location_id: string
    base_price: number
    currency_code?: string
    backorder_enabled?: boolean
    backorder_available_date?: string | null
  }

  if (!variant_id || !location_id || base_price === undefined) {
    res.status(400).json({
      error: "variant_id, location_id, and base_price are required",
    })
    return
  }

  const warehousePricingService: WarehousePricingService = req.scope.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  const price = await warehousePricingService.upsertWarehousePrice({
    variant_id,
    location_id,
    base_price,
    currency_code,
    backorder_enabled,
    backorder_available_date: backorder_available_date
      ? new Date(backorder_available_date)
      : null,
  })

  res.json({ warehouse_price: price })
}
