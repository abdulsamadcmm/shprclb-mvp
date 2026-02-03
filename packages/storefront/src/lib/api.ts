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
