import WarehousePricingService from "./service"
import { Module } from "@medusajs/framework/utils"

export const WAREHOUSE_PRICING_MODULE = "warehousePricing"

export default Module(WAREHOUSE_PRICING_MODULE, {
  service: WarehousePricingService,
})
