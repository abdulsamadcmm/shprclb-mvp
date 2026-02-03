import WarehousePricingModule from "../modules/warehouse-pricing"
import StockLocationModule from "@medusajs/medusa/stock-location"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  {
    linkable: StockLocationModule.linkable.stockLocation,
    isList: true,
  },
  WarehousePricingModule.linkable.warehousePrice
)
