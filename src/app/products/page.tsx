"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  X,
  ShoppingCart,
  Package,
  LayoutTemplate,
  Minus,
  Plus,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

// Import komponen kategori
import GmailProducts from "./gmail";
import EbookProducts from "./ebook";
import AppPremiumProducts from "./appPrem";
import TemplateProducts from "./templates";

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast Hook
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};

// Toast Component
const ToastNotification = ({ 
  toast, 
  onClose 
}: { 
  toast: Toast; 
  onClose: () => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/50',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20',
          text: 'text-emerald-400',
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/50',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          iconBg: 'bg-red-500/20',
          text: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/50',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
          iconBg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/50',
          icon: <Info className="w-5 h-5 text-blue-400" />,
          iconBg: 'bg-blue-500/20',
          text: 'text-blue-400',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl backdrop-blur-sm
        ${styles.bg} ${styles.border}
        border shadow-lg
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
        {styles.icon}
      </div>

      {/* Message */}
      <div className="flex-1 pt-1">
        <p className={`text-sm font-medium ${styles.text}`}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full px-4">
      {toasts.map(toast => (
        <ToastNotification 
          key={toast.id} 
          toast={toast} 
          onClose={() => onRemove(toast.id)} 
        />
      ))}
    </div>
  );
};

// ============================================
// PRODUCT TYPES
// ============================================

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit_count: number;
  product_type: string;
  file_url: string | null;
  is_active: boolean;
  created_at?: string;
}

// ============================================
// MAIN PRODUCTS PAGE COMPONENT
// ============================================

export default function ProductsPage() {
  const router = useRouter();
  
  // Toast System
  const { toasts, showToast, removeToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<
    "gmail" | "ebook" | "app" | "template" | null
  >(null);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredSearchResults, setFilteredSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cart quantities
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const { addToCart, cart, updateQuantity } = useCart();

  // Load all products for search
  useEffect(() => {
    async function fetchAllProducts() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Fetch products error:", error);
        showToast("Gagal memuat produk. Silakan refresh halaman.", "error");
      }

      if (data) setAllProducts(data as Product[]);
      setIsLoading(false);
    }

    fetchAllProducts();
  }, []);

  // Update cart quantities based on cart state
  useEffect(() => {
    const quantities: Record<string, number> = {};
    cart.forEach((item) => {
      quantities[item.productId] = item.quantity;
    });
    setCartQuantities(quantities);
  }, [cart]);

  // Filter search results with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        setFilteredSearchResults([]);
        return;
      }

      const results = allProducts.filter((p) => {
        const name = p.name?.toLowerCase() ?? "";
        const desc = p.description?.toLowerCase() ?? "";
        return name.includes(q) || desc.includes(q);
      });

      setFilteredSearchResults(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allProducts]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Adapter for Product to ProductRow
  const toProductRow = (product: Product) => {
    return {
      id: product.id,
      name: product.name,
      unit_count: product.unit_count,
      price: product.price,
      product_type: product.product_type,
      description: product.description,
      file_url: product.file_url,
      is_active: product.is_active,
      created_at: product.created_at,
    } as any;
  };

  // Handle add to cart with toast
  const handleAddToCart = (product: Product) => {
    const ok = addToCart(toProductRow(product));
    if (!ok) {
      showToast("Stok tidak cukup untuk menambahkan produk ini ke keranjang.", "error");
    } else {
      showToast(`${product.name} ditambahkan ke keranjang!`, "success");
    }
    return ok;
  };

  // Handle quantity change with toast
  const handleQuantityChange = (productId: string, change: number) => {
    const currentQty = cartQuantities[productId] || 0;
    const newQty = currentQty + change;

    const ok = updateQuantity(productId, newQty <= 0 ? 0 : newQty);
    if (!ok) {
      showToast("Stok tidak cukup untuk menambah quantity.", "error");
    }
  };

  // Handle buy now
  const handleBuyNow = (product: Product) => {
    if (!cartQuantities[product.id]) {
      const ok = handleAddToCart(product);
      if (!ok) return;
    }
    router.push("/checkout");
  };

  // Get category icon
  const getCategoryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "gmail":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        );
      case "ebook":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
        );
      case "template":
        return <LayoutTemplate className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // Get category color
  const getCategoryColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "gmail":
        return "from-red-500 to-yellow-500";
      case "ebook":
        return "from-purple-500 to-pink-500";
      case "template":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-slate-600 to-slate-500";
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header & Search (Always visible when no category selected) */}
        {selectedCategory === null && (
          <div className="space-y-8 mb-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                Pilih Kategori{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Produk Premium
                </span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                Dapatkan akses ke produk digital berkualitas tinggi dengan harga terjangkau.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari produk (contoh: Gmail, Ebook...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-full py-3.5 pl-12 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-inter placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        {searchQuery ? (
          /* SEARCH RESULTS */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-300">
                Hasil pencarian untuk <span className="text-emerald-400">"{searchQuery}"</span>
              </h3>
              {filteredSearchResults.length > 0 && (
                <span className="text-sm text-slate-500">
                  {filteredSearchResults.length} produk ditemukan
                </span>
              )}
            </div>

            {isLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-lg bg-slate-800" />
                        <div className="w-16 h-5 rounded bg-slate-800" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-800 rounded w-full" />
                      </div>
                      <div className="h-10 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSearchResults.length > 0 ? (
              /* Search Results Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSearchResults.map((product) => {
                  const inCart = (cartQuantities[product.id] || 0) > 0;
                  const quantity = cartQuantities[product.id] || 0;

                  return (
                    <div
                      key={product.id}
                      className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      <div className="p-6">
                        {/* Header Product */}
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${getCategoryColor(
                              product.product_type
                            )} text-white shadow-lg`}
                          >
                            {getCategoryIcon(product.product_type)}
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400">
                            {product.product_type}
                          </span>
                        </div>

                        {/* Product Info */}
                        <h4 className="font-bold text-lg text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-14">
                          {product.name}
                        </h4>

                        {product.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                            {product.description}
                          </p>
                        )}

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-800">
                          <span className="font-mono text-emerald-400 font-bold text-lg">
                            {formatRupiah(product.price)}
                          </span>
                          {product.unit_count > 0 && (
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
                              Stok: {product.unit_count}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          {/* Quantity Controls */}
                          {inCart && (
                            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                              <button
                                onClick={() => handleQuantityChange(product.id, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              <span className="font-bold text-slate-200 min-w-8 text-center">
                                {quantity}
                              </span>

                              <button
                                onClick={() => handleQuantityChange(product.id, 1)}
                                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={quantity >= product.unit_count}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Main Action Buttons */}
                          <div className="flex gap-2">
                            {!inCart ? (
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all font-medium"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span>Keranjang</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push("/checkout")}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 transition-all font-medium"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span>Di Keranjang</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleBuyNow(product)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white transition-all font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                            >
                              <Zap className="w-4 h-4" />
                              <span>Beli</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20 bg-slate-900/30 rounded-3xl border-2 border-slate-800 border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Produk tidak ditemukan</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Coba gunakan kata kunci lain atau lihat kategori produk kami
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all"
                >
                  Lihat Semua Produk
                </button>
              </div>
            )}
          </div>
        ) : selectedCategory === null ? (
          /* CATEGORY SELECTION */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Gmail Category */}
            <button
              onClick={() => setSelectedCategory("gmail")}
              className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-emerald-500 bg-slate-900/50 hover:bg-slate-900 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-slate-500 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-emerald-400 transition-colors">
                Akun Gmail
              </h3>
              <p className="text-sm text-slate-400 mb-4">Akun Premium Fresh & Aman 100%</p>
            </button>

            {/* E-book Category */}
            <button
              onClick={() => setSelectedCategory("ebook")}
              className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-purple-500 bg-slate-900/50 hover:bg-slate-900 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-purple-500 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-slate-500 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-purple-400 transition-colors">
                E-Book Premium
              </h3>
              <p className="text-sm text-slate-400 mb-4">Panduan Lengkap & To The Point</p>
            </button>

            {/* Template Category */}
            <button
              onClick={() => setSelectedCategory("template")}
              className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <LayoutTemplate className="w-6 h-6 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-blue-500 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-slate-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">
                WP Templates
              </h3>
              <p className="text-sm text-slate-400 mb-4">Tema & Plugin Premium</p>
            </button>

            {/* App Premium (Coming Soon) */}
            <div className="relative text-left p-6 rounded-2xl border-2 border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                  Segera
                </span>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 text-slate-400">App Premium</h3>
              <p className="text-sm text-slate-500 mb-4">Akses Premium ke Aplikasi Terbaik</p>
            </div>
          </div>
        ) : (
          /* CATEGORY DETAIL */
          <div>
            {selectedCategory === "gmail" && <GmailProducts onBack={() => setSelectedCategory(null)} />}
            {selectedCategory === "ebook" && <EbookProducts onBack={() => setSelectedCategory(null)} />}
            {selectedCategory === "template" && (
              <TemplateProducts onBack={() => setSelectedCategory(null)} />
            )}
            {selectedCategory === "app" && <AppPremiumProducts onBack={() => setSelectedCategory(null)} />}
          </div>
        )}
      </div>
      {/* Toast Container - Always render at the end */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}