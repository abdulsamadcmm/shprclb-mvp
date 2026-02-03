import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStockLocationsWorkflow } from "@medusajs/medusa/core-flows"
import { WAREHOUSE_PRICING_MODULE } from "../modules/warehouse-pricing"
import WarehousePricingService from "../modules/warehouse-pricing/service"

export default async function seedWarehouseData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const warehousePricingService: WarehousePricingService = container.resolve(
    WAREHOUSE_PRICING_MODULE
  )

  logger.info("Starting warehouse data seed...")

  // Check existing stock locations
  const existingLocations = await stockLocationModule.listStockLocations({})
  logger.info(`Found ${existingLocations.length} existing stock locations`)

  // Create additional stock locations if we only have one
  let stockLocations = existingLocations

  if (existingLocations.length < 3) {
    logger.info("Creating additional stock locations...")

    const locationsToCreate = [
      {
        name: "Mumbai Warehouse",
        address: {
          city: "Mumbai",
          country_code: "IN",
          address_1: "Andheri East",
        },
      },
      {
        name: "Delhi Warehouse",
        address: {
          city: "New Delhi",
          country_code: "IN",
          address_1: "Connaught Place",
        },
      },
      {
        name: "Bangalore Warehouse",
        address: {
          city: "Bangalore",
          country_code: "IN",
          address_1: "Koramangala",
        },
      },
    ].filter(
      (loc) => !existingLocations.some((existing) => existing.name === loc.name)
    )

    if (locationsToCreate.length > 0) {
      const { result } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: locationsToCreate,
        },
      })
      stockLocations = [...existingLocations, ...result]
    }
  }

  logger.info(`Total stock locations: ${stockLocations.length}`)

  // Get all product variants
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "variants.id", "variants.title", "variants.sku"],
  })

  if (!products || products.length === 0) {
    logger.warn("No products found. Run the main seed script first: npx medusa exec ./src/scripts/seed.ts")
    return
  }

  logger.info(`Found ${products.length} products`)

  // Create warehouse prices for each variant at each location
  const priceConfigs = [
    { locationIndex: 0, priceMultiplier: 1.0, backorderEnabled: true },    // Mumbai - base price
    { locationIndex: 1, priceMultiplier: 1.05, backorderEnabled: false },  // Delhi - 5% higher
    { locationIndex: 2, priceMultiplier: 0.95, backorderEnabled: true },   // Bangalore - 5% lower
  ]

  let pricesCreated = 0

  for (const product of products) {
    if (!product.variants) continue

    for (const variant of product.variants) {
      for (const config of priceConfigs) {
        if (config.locationIndex >= stockLocations.length) continue

        const location = stockLocations[config.locationIndex]
        
        // Base price varies by variant (simulate different pricing)
        const basePrice = 10000 + Math.floor(Math.random() * 5000) // ₹100-150 in paise
        const finalPrice = Math.round(basePrice * config.priceMultiplier)

        try {
          await warehousePricingService.upsertWarehousePrice({
            variant_id: variant.id,
            location_id: location.id,
            base_price: finalPrice,
            currency_code: "INR",
            backorder_enabled: config.backorderEnabled,
            backorder_available_date: config.backorderEnabled
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
              : null,
          })
          pricesCreated++
        } catch (error) {
          logger.error(`Failed to create price for ${variant.id} at ${location.id}: ${error}`)
        }
      }
    }
  }

  logger.info(`Created/updated ${pricesCreated} warehouse prices`)
  logger.info("Finished seeding warehouse data!")
}
