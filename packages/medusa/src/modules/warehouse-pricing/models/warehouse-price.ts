import { model } from "@medusajs/framework/utils"

const WarehousePrice = model.define("warehouse_price", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  location_id: model.text(),
  base_price: model.bigNumber(), // Price in cents
  currency_code: model.text().default("INR"),
  backorder_enabled: model.boolean().default(false),
  backorder_available_date: model.dateTime().nullable(),
})

export default WarehousePrice
