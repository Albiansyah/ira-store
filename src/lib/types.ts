// src/lib/types.ts

export type OrderStatus = "pending" | "paid" | "completed" | "cancelled";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface ProductRow {
  id: string;
  name: string;
  price: number;
  unit_count: number;
  is_active: boolean;
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
