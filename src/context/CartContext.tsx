// src/contexts/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ProductRow } from "@/lib/types";

export interface CartItem {
  productId: string;
  name: string;
  unitCount: number;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  stockAvailable: number | null;
  totalItems: number;
  totalUnitsInCart: number;
  totalPrice: number;
  addToCart: (product: ProductRow) => boolean;
  buyNow: (product: ProductRow) => boolean;
  updateQuantity: (productId: string, newQuantity: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartLoading: boolean;
  refreshStock: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ds_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Function untuk load stock dari Supabase
  const loadStock = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("accounts_stock")
        .select("id, is_used");

      if (error) {
        console.error("Load stock error:", error);
        return;
      }

      const rows = (data ?? []) as Array<{ id: string; is_used?: boolean | null }>;
      const available = rows.filter((row) => row.is_used !== true).length;
      setStockAvailable(available);
    } catch (error) {
      console.error("Failed to load stock:", error);
    }
  }, []);

  // Load stock saat pertama kali mount dan set interval
  useEffect(() => {
    loadStock();
    const interval = setInterval(loadStock, 30000); // Refresh setiap 30 detik
    return () => clearInterval(interval);
  }, [loadStock]);

  // Load cart dari localStorage saat pertama kali mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsedCart = JSON.parse(raw) as CartItem[];
        setCart(parsedCart);
      }
    } catch (e) {
      console.warn("Gagal parse cart dari localStorage", e);
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  // Simpan cart ke localStorage setiap kali cart berubah
  useEffect(() => {
    if (isCartLoading) return;
    if (typeof window === "undefined") return;
    
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Gagal simpan cart ke localStorage", e);
    }
  }, [cart, isCartLoading]);

  // Hitung total units di cart
  const totalUnitsInCart = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitCount * item.quantity, 0),
    [cart]
  );

  // Hitung total items di cart
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Hitung total harga
  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // Tambah produk ke cart
  const addToCart = useCallback((product: ProductRow): boolean => {
    const existing = cart.find((c) => c.productId === product.id);
    const unitsInCartExcludingThis =
      totalUnitsInCart - (existing ? existing.unitCount * existing.quantity : 0);
    const newQuantity = existing ? existing.quantity + 1 : 1;
    const newTotalUnits = unitsInCartExcludingThis + product.unit_count * newQuantity;

    // Validasi stock
    if (stockAvailable !== null && newTotalUnits > stockAvailable) {
      return false;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: newQuantity } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitCount: product.unit_count,
          price: product.price,
          quantity: 1,
        },
      ];
    });
    return true;
  }, [cart, totalUnitsInCart, stockAvailable]);

  // Buy now - langsung clear cart dan isi dengan 1 produk ini
  const buyNow = useCallback((product: ProductRow): boolean => {
    // Validasi stock
    if (stockAvailable !== null && product.unit_count > stockAvailable) {
      return false;
    }

    const newItem: CartItem = {
      productId: product.id,
      name: product.name,
      unitCount: product.unit_count,
      price: product.price,
      quantity: 1,
    };
    setCart([newItem]);
    return true;
  }, [stockAvailable]);

  // Update quantity produk di cart
  const updateQuantity = useCallback((
    productId: string,
    newQuantity: number
  ): boolean => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return true;
    }

    const item = cart.find((c) => c.productId === productId);
    if (!item) return false;

    const unitsInCartExcludingThis =
      totalUnitsInCart - item.unitCount * item.quantity;
    const newTotalUnits = unitsInCartExcludingThis + item.unitCount * newQuantity;

    // Validasi stock
    if (stockAvailable !== null && newTotalUnits > stockAvailable) {
      return false;
    }

    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, quantity: newQuantity } : c
      )
    );
    return true;
  }, [cart, totalUnitsInCart, stockAvailable]);

  // Hapus produk dari cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  // Clear semua cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Manual refresh stock (untuk dipanggil setelah checkout, dll)
  const refreshStock = useCallback(async () => {
    await loadStock();
  }, [loadStock]);

  return (
    <CartContext.Provider
      value={{
        cart,
        stockAvailable,
        totalItems,
        totalUnitsInCart,
        totalPrice,
        addToCart,
        buyNow,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartLoading,
        refreshStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}