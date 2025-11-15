"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient"; // Ambil dari file produk Anda
import type { ProductRow } from "@/lib/types"; // Ambil dari file produk Anda

// (Jika Anda belum punya type ProductRow di @/lib/types,
// Anda bisa tambahkan ini sementara di atas CartProvider)
// interface ProductRow {
//   id: string;
//   name: string;
//   price: number;
//   unit_count: number;
//   is_active: boolean;
// }

// Definisikan tipe untuk item di keranjang
export interface CartItem {
  productId: string;
  name: string;
  unitCount: number;
  price: number;
  quantity: number;
}

// Definisikan tipe untuk Context
interface CartContextType {
  cart: CartItem[];
  stockAvailable: number | null;
  totalItems: number; // Total item (badge)
  totalUnitsInCart: number; // Total unit (akun)
  totalPrice: number; // Total harga
  addToCart: (product: ProductRow) => boolean; // Return status sukses
  buyNow: (product: ProductRow) => boolean; // Return status sukses
  updateQuantity: (productId: string, newQuantity: number) => boolean; // Return status sukses
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ds_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Load stock (sama seperti di page produk Anda sebelumnya)
  useEffect(() => {
    async function loadStock() {
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
    }

    loadStock();
    const interval = setInterval(loadStock, 30000); // refresh stock
    return () => clearInterval(interval);
  }, []);

  // Load cart from localStorage on mount (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      try {
        setCart(JSON.parse(raw) as CartItem[]);
      } catch (e) {
        console.warn("Gagal parse cart dari localStorage", e);
      }
    }
    setIsCartLoading(false);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isCartLoading) return; // Jangan save saat pertama kali load
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, isCartLoading]);

  // --- Memoized Values (Perhitungan otomatis) ---
  const totalUnitsInCart = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitCount * item.quantity, 0),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // --- Cart Actions ---
  const addToCart = (product: ProductRow): boolean => {
    const existing = cart.find((c) => c.productId === product.id);
    const unitsInCartExcludingThis =
      totalUnitsInCart - (existing ? existing.unitCount * existing.quantity : 0);
    const newQuantity = existing ? existing.quantity + 1 : 1;
    const newTotalUnits = unitsInCartExcludingThis + product.unit_count * newQuantity;

    if (stockAvailable !== null && newTotalUnits > stockAvailable) {
      // Gagal, stok tidak cukup
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
    return true; // Sukses
  };
  
  const buyNow = (product: ProductRow): boolean => {
    // Cek apakah 1 item ini saja muat di stok
    if (stockAvailable !== null && product.unit_count > stockAvailable) {
      return false; // Stok tidak cukup
    }
    
    // Set keranjang HANYA dengan item ini
    const newItem: CartItem = {
      productId: product.id,
      name: product.name,
      unitCount: product.unit_count,
      price: product.price,
      quantity: 1,
    };
    setCart([newItem]);
    return true; // Sukses
  };

  const updateQuantity = (
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

    if (stockAvailable !== null && newTotalUnits > stockAvailable) {
      return false; // Gagal, stok tidak cukup
    }

    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, quantity: newQuantity } : c
      )
    );
    return true; // Sukses
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom Hook untuk mempermudah pemakaian
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}