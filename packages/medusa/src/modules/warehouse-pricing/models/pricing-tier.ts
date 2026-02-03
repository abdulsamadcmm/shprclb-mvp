import { model } from "@medusajs/framework/utils"

const PricingTier = model.define("pricing_tier", {
  id: model.id().primaryKey(),
  warehouse_price_id: model.text(),
  min_quantity: model.number(),
  max_quantity: model.number().nullable(), // null = unlimited (e.g., "50+")
  unit_price: model.bigNumber(), // Price per unit in cents
})

export default PricingTier
