// src/lib/types.ts

export type OrderStatus = "pending" | "paid" | "completed" | "cancelled";

export type ProductType = "gmail" | "ebook" | "app" | "template";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface ProductRow {
  id: string;
  name: string;
  slug?: string; 
  description?: string; 
  price: number;
  discount_price?: number | null;
  discount_percentage?: number | null;
  unit_count: number;
  is_active: boolean;
  product_type: ProductType; 
  file_url?: string | null; 
  created_at?: string; 
  updated_at?: string; 
}

export interface AccountStockRow {
  id: string;
  username: string;
  password: string;
  meta: any;
  is_used: boolean;
  assigned_order_item_id: string | null;
}

export interface OrderItemRow {
  id: string;
  product_id: string;
  quantity: number;
  effective_unit_count: number;
}