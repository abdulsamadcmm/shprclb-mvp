const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';

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

export async function getProducts(): Promise<ProductWithWarehousePricing[]> {
  const response = await fetch(`${BFF_URL}/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data: ProductsResponse = await response.json();
  return data.products;
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
