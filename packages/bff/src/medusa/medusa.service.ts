import { Injectable } from '@nestjs/common';

export interface MedusaProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail: string | null;
  variants: MedusaVariant[];
}

export interface MedusaVariant {
  id: string;
  title: string;
  sku: string | null;
  prices: MedusaPrice[];
  inventory_quantity?: number;
  thumbnail?: string | null;
}

export interface MedusaPrice {
  id: string;
  amount: number;
  currency_code: string;
}

export interface WarehousePrice {
  id: string;
  variant_id: string;
  location_id: string;
  base_price: number;
  currency_code: string;
  backorder_enabled: boolean;
  backorder_available_date: string | null;
}

export interface PricingTier {
  id: string;
  warehouse_price_id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

export interface StockLocation {
  id: string;
  name: string;
  address?: {
    city?: string;
    country_code?: string;
  };
}

export interface InventoryLevel {
  id: string;
  inventory_item_id: string;
  location_id: string;
  stocked_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  is_active: boolean;
  parent_category_id: string | null;
}

@Injectable()
export class MedusaService {
  private readonly baseUrl: string;
  private adminToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
  }

  private async getAdminToken(): Promise<string> {
    if (this.adminToken) {
      return this.adminToken;
    }

    // For BFF-to-Medusa calls, we use a service account
    // In production, use API keys or proper service auth
    const response = await fetch(`${this.baseUrl}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.MEDUSA_ADMIN_EMAIL || 'admin@test.com',
        password: process.env.MEDUSA_ADMIN_PASSWORD || 'admin123',
      }),
    });

    const data = await response.json();
    this.adminToken = data.token;
    return this.adminToken!;
  }

  private async adminFetch<T>(path: string): Promise<T> {
    const token = await this.getAdminToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async storeFetch<T>(path: string, publishableKey?: string): Promise<T> {
    const headers: Record<string, string> = {};
    if (publishableKey) {
      headers['x-publishable-api-key'] = publishableKey;
    }

    const response = await fetch(`${this.baseUrl}${path}`, { headers });

    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getProduct(productId: string): Promise<MedusaProduct | null> {
    try {
      const data = await this.adminFetch<{ product: MedusaProduct }>(
        `/admin/products/${productId}`,
      );
      return data.product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  async getProducts(categoryId?: string): Promise<MedusaProduct[]> {
    try {
      const query = categoryId ? `?category_id=${categoryId}` : '';
      const data = await this.adminFetch<{ products: MedusaProduct[] }>(
        `/admin/products${query}`,
      );
      return data.products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  async getCategories(): Promise<ProductCategory[]> {
    try {
      const data = await this.adminFetch<{ product_categories: ProductCategory[] }>(
        '/admin/product-categories',
      );
      return data.product_categories || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  async getWarehousePrices(variantId?: string): Promise<WarehousePrice[]> {
    try {
      const query = variantId ? `?variant_id=${variantId}` : '';
      const data = await this.adminFetch<{ warehouse_prices: WarehousePrice[] }>(
        `/admin/warehouse-prices${query}`,
      );
      return data.warehouse_prices;
    } catch (error) {
      console.error('Failed to fetch warehouse prices:', error);
      return [];
    }
  }

  async getStockLocations(): Promise<StockLocation[]> {
    try {
      const data = await this.adminFetch<{ stock_locations: StockLocation[] }>(
        '/admin/stock-locations',
      );
      return data.stock_locations;
    } catch (error) {
      console.error('Failed to fetch stock locations:', error);
      return [];
    }
  }

  async getInventoryLevels(locationId?: string): Promise<InventoryLevel[]> {
    try {
      const query = locationId ? `?location_id=${locationId}` : '';
      const data = await this.adminFetch<{ inventory_levels: InventoryLevel[] }>(
        `/admin/inventory-items/location-levels${query}`,
      );
      return data.inventory_levels || [];
    } catch (error) {
      console.error('Failed to fetch inventory levels:', error);
      return [];
    }
  }

  async getPricingTiers(warehousePriceId: string): Promise<PricingTier[]> {
    try {
      const data = await this.adminFetch<{ pricing_tiers: PricingTier[] }>(
        `/admin/warehouse-prices/${warehousePriceId}/tiers`,
      );
      return data.pricing_tiers || [];
    } catch (error) {
      console.error('Failed to fetch pricing tiers:', error);
      return [];
    }
  }

  async calculatePrice(
    warehousePriceId: string,
    quantity: number,
  ): Promise<{
    quantity: number;
    unit_price: number;
    total_price: number;
    tier_applied: boolean;
    tier_name: string;
  }> {
    try {
      const data = await this.adminFetch<{
        quantity: number;
        unit_price: number;
        total_price: number;
        tier_applied: boolean;
        tier_name: string;
      }>(`/admin/warehouse-prices/${warehousePriceId}/calculate?quantity=${quantity}`);
      return data;
    } catch (error) {
      console.error('Failed to calculate price:', error);
      throw error;
    }
  }
}
