const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';

export interface PricingTier {
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
  pricing_tiers: PricingTier[];
}

export interface VariantWithWarehouses {
  id: string;
  title: string;
  sku: string | null;
  thumbnail?: string | null;
  warehouses: WarehouseInfo[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail: string | null;
}

export interface ProductWithWarehousePricing {
  product: Product;
  variants: VariantWithWarehouses[];
}

export interface ProductsResponse {
  products: ProductWithWarehousePricing[];
}

export interface CalculatedPrice {
  quantity: number;
  unit_price: number;
  total_price: number;
  tier_applied: boolean;
  tier_name: string;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  is_active: boolean;
  parent_category_id: string | null;
}

export interface CategoriesResponse {
  categories: Category[];
}

export async function getProducts(categoryId?: string): Promise<ProductWithWarehousePricing[]> {
  const query = categoryId ? `?category_id=${categoryId}` : '';
  const response = await fetch(`${BFF_URL}/products${query}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data: ProductsResponse = await response.json();
  return data.products;
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${BFF_URL}/categories`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data: CategoriesResponse = await response.json();
  return data.categories;
}

export async function getProduct(id: string): Promise<ProductWithWarehousePricing | null> {
  const response = await fetch(`${BFF_URL}/products/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

export async function calculatePrice(
  productId: string,
  warehousePriceId: string,
  quantity: number,
): Promise<CalculatedPrice> {
  const response = await fetch(
    `${BFF_URL}/products/${productId}/price?warehouse_price_id=${warehousePriceId}&quantity=${quantity}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error('Failed to calculate price');
  }

  return response.json();
}

export async function calculateCartLineItem(
  warehousePriceId: string,
  quantity: number,
): Promise<CalculatedPrice> {
  const response = await fetch(`${BFF_URL}/cart/calculate-line-item`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_price_id: warehousePriceId,
      quantity,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to calculate cart line item');
  }

  return response.json();
}

// Order types and functions
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

export interface OrderLineItem {
  id: string;
  title: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: {
    warehouse_price_id: string;
    location_id: string;
    location_name: string;
    moq: number;
    product_title: string;
    variant_title: string;
    thumbnail?: string;
  };
  thumbnail?: string;
}

export interface Order {
  id: string;
  display_id: number;
  email: string;
  shipping_address: ShippingAddress;
  items: OrderLineItem[];
  subtotal: number;
  total: number;
  created_at: string;
  metadata?: {
    payment_method?: string;
  };
}

export interface CreateOrderData {
  email: string;
  shipping_address: ShippingAddress;
  payment_method: string;
  items: Array<{
    variant_id: string;
    quantity: number;
    warehouse_price_id: string;
    location_id: string;
    location_name: string;
    moq: number;
    product_title: string;
    variant_title: string;
    thumbnail?: string;
  }>;
}

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  const response = await fetch(`${BFF_URL}/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create order: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.order;
}

export async function getOrder(orderId: string): Promise<Order> {
  const response = await fetch(`${BFF_URL}/orders/${orderId}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  const data = await response.json();
  return data.order;
}
