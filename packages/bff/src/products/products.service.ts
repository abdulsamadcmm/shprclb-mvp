import { Injectable } from '@nestjs/common';
import {
  MedusaService,
  MedusaProduct,
  WarehousePrice,
  StockLocation,
} from '../medusa/medusa.service';

export interface WarehouseInfo {
  location_id: string;
  location_name: string;
  price: number;
  currency_code: string;
  inventory_quantity: number;
  backorder_enabled: boolean;
  backorder_available_date: string | null;
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

    // Build variants with warehouse info
    const variants: VariantWithWarehouses[] = product.variants.map((variant) => {
      const warehousePrices = pricesByVariant.get(variant.id) || [];

      const warehouses: WarehouseInfo[] = warehousePrices.map((wp) => ({
        location_id: wp.location_id,
        location_name: locationMap.get(wp.location_id) || wp.location_id,
        price: wp.base_price,
        currency_code: wp.currency_code,
        inventory_quantity: 0, // TODO: fetch from inventory module
        backorder_enabled: wp.backorder_enabled,
        backorder_available_date: wp.backorder_available_date,
      }));

      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        warehouses,
      };
    });

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
