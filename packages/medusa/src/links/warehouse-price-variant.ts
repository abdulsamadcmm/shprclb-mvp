import WarehousePricingModule from "../modules/warehouse-pricing"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  {
    linkable: ProductModule.linkable.productVariant,
    isList: true,
  },
  WarehousePricingModule.linkable.warehousePrice
)
