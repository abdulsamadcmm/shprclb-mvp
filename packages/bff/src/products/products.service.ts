import { Injectable } from '@nestjs/common';
import {
  MedusaService,
  MedusaProduct,
  WarehousePrice,
  StockLocation,
  PricingTier,
} from '../medusa/medusa.service';

export interface PricingTierInfo {
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

export interface WarehouseInfo {
  warehouse_price_id: string;
  location_id: string;
  location_name: string;
  price: number;
  currency_code: string;
  inventory_quantity: number;
  backorder_enabled: boolean;
  backorder_available_date: string | null;
  pricing_tiers: PricingTierInfo[];
}

export interface VariantWithWarehouses {
  id: string;
  title: string;
  sku: string | null;
  warehouses: WarehouseInfo[];
}

export interface ProductWithWarehousePricing {
  product: MedusaProduct;
  variants: VariantWithWarehouses[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly medusaService: MedusaService) {}

  async getProductWithWarehousePricing(
    productId: string,
  ): Promise<ProductWithWarehousePricing | null> {
    // Fetch all data in parallel
    const [product, stockLocations] = await Promise.all([
      this.medusaService.getProduct(productId),
      this.medusaService.getStockLocations(),
    ]);

    if (!product) {
      return null;
    }

    // Create a map of location_id -> location_name
    const locationMap = new Map<string, string>();
    stockLocations.forEach((loc) => {
      locationMap.set(loc.id, loc.name);
    });

    // Fetch warehouse prices for all variants
    const variantIds = product.variants.map((v) => v.id);
    const allWarehousePrices: WarehousePrice[] = [];

    for (const variantId of variantIds) {
      const prices = await this.medusaService.getWarehousePrices(variantId);
      allWarehousePrices.push(...prices);
    }

    // Group warehouse prices by variant
    const pricesByVariant = new Map<string, WarehousePrice[]>();
    allWarehousePrices.forEach((price) => {
      const existing = pricesByVariant.get(price.variant_id) || [];
      existing.push(price);
      pricesByVariant.set(price.variant_id, existing);
    });

    // Build variants with warehouse info (including pricing tiers)
    const variants: VariantWithWarehouses[] = await Promise.all(
      product.variants.map(async (variant) => {
        const warehousePrices = pricesByVariant.get(variant.id) || [];

        const warehouses: WarehouseInfo[] = await Promise.all(
          warehousePrices.map(async (wp) => {
            // Fetch pricing tiers for this warehouse price
            const tiers = await this.medusaService.getPricingTiers(wp.id);

            return {
              warehouse_price_id: wp.id,
              location_id: wp.location_id,
              location_name: locationMap.get(wp.location_id) || wp.location_id,
              price: wp.base_price,
              currency_code: wp.currency_code,
              inventory_quantity: 0, // TODO: fetch from inventory module
              backorder_enabled: wp.backorder_enabled,
              backorder_available_date: wp.backorder_available_date,
              pricing_tiers: tiers.map((t) => ({
                min_quantity: t.min_quantity,
                max_quantity: t.max_quantity,
                unit_price: t.unit_price,
              })),
            };
          }),
        );

        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          warehouses,
        };
      }),
    );

    return {
      product,
      variants,
    };
  }

  async getProductsWithWarehousePricing(): Promise<ProductWithWarehousePricing[]> {
    const products = await this.medusaService.getProducts();
    const results: ProductWithWarehousePricing[] = [];

    for (const product of products) {
      const productWithPricing = await this.getProductWithWarehousePricing(
        product.id,
      );
      if (productWithPricing) {
        results.push(productWithPricing);
      }
    }

    return results;
  }
}
