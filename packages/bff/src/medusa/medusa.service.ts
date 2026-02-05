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

export interface MedusaCart {
  id: string;
  email?: string;
  items: CartLineItem[];
  total: number;
  subtotal: number;
}

export interface CartLineItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  metadata?: Record<string, any>;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  postal_code: string;
  phone?: string;
}

export interface MedusaOrder {
  id: string;
  display_id: number;
  email: string;
  shipping_address: ShippingAddress;
  items: OrderLineItem[];
  subtotal: number;
  total: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface OrderLineItem {
  id: string;
  title: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: Record<string, any>;
  thumbnail?: string;
}

@Injectable()
export class MedusaService {
  private readonly baseUrl: string;
  private adminToken: string | null = null;
  private readonly publishableKey: string;

  constructor() {
    this.baseUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
    this.publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY || '';
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

  // Cart and Order methods
  async createCart(regionId?: string): Promise<MedusaCart> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const body: any = {};
      if (regionId) {
        body.region_id = regionId;
      }

      const response = await fetch(`${this.baseUrl}/store/carts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create cart: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Failed to create cart:', error);
      throw error;
    }
  }

  async addLineItem(
    cartId: string,
    item: {
      variant_id: string;
      quantity: number;
      metadata?: Record<string, any>;
    },
  ): Promise<MedusaCart> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/carts/${cartId}/line-items`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(item),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add line item: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Failed to add line item:', error);
      throw error;
    }
  }

  async updateCart(
    cartId: string,
    updates: {
      email?: string;
      shipping_address?: ShippingAddress;
      metadata?: Record<string, any>;
    },
  ): Promise<MedusaCart> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(`${this.baseUrl}/store/carts/${cartId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update cart: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  }

  async initializePayment(cartId: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/payment-collections`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ cart_id: cartId }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to initialize payment: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.payment_collection;
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      throw error;
    }
  }

  async createPaymentSession(
    paymentCollectionId: string,
    providerId: string = 'pp_system_default',
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ provider_id: providerId }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create payment session: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.payment_collection;
    } catch (error) {
      console.error('Failed to create payment session:', error);
      throw error;
    }
  }

  async getShippingOptions(cartId: string): Promise<any[]> {
    try {
      const headers: Record<string, string> = {};
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/shipping-options?cart_id=${cartId}`,
        { headers },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get shipping options: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.shipping_options || [];
    } catch (error) {
      console.error('Failed to get shipping options:', error);
      throw error;
    }
  }

  async addShippingMethod(cartId: string, optionId: string): Promise<MedusaCart> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/carts/${cartId}/shipping-methods`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ option_id: optionId }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to add shipping method: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Failed to add shipping method:', error);
      throw error;
    }
  }

  async completeCart(cartId: string): Promise<MedusaOrder> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(
        `${this.baseUrl}/store/carts/${cartId}/complete`,
        {
          method: 'POST',
          headers,
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to complete cart: ${response.status} - ${errorData}`,
        );
      }

      const data = await response.json();
      return data.order || data.data;
    } catch (error) {
      console.error('Failed to complete cart:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<MedusaOrder> {
    try {
      const headers: Record<string, string> = {};
      
      if (this.publishableKey) {
        headers['x-publishable-api-key'] = this.publishableKey;
      }

      const response = await fetch(`${this.baseUrl}/store/orders/${orderId}`, {
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get order: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      console.error('Failed to get order:', error);
      throw error;
    }
  }
}
