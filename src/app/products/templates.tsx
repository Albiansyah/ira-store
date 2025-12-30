"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ProductRow } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { 
  LayoutTemplate, 
  Monitor, 
  ShoppingCart, 
  Zap, 
  Check, 
  Star, 
  Tag,
  ArrowLeft,
  Sparkles,
  TrendingDown
} from "lucide-react";

interface TemplateProductsProps {
  onBack: () => void;
}

export default function TemplateProducts({ onBack }: TemplateProductsProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addToCart, buyNow: buyNowContext } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("product_type", "template")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Load template error:", error);
      } else {
        setProducts((data || []) as ProductRow[]);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  function handleBuyNow(product: ProductRow) {
    const success = buyNowContext(product);
    if (success) {
      setTimeout(() => router.push("/checkout"), 100);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        {/* Back Button - Improved */}
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-blue-500/60 hover:bg-slate-800/80 text-sm font-medium text-slate-300 hover:text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/20 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Kembali ke Kategori
        </button>
      </div>

      {/* Product Grid - Enhanced */}
      <section className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="h-[420px] rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/50 animate-pulse"
              >
                <div className="p-6 space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800/80"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-800/80 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-full"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-700/50 rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-900/30 backdrop-blur-sm">
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 mb-6">
              <LayoutTemplate className="w-20 h-20 text-slate-600" />
            </div>
            <p className="text-slate-400 text-xl font-medium mb-2">Belum ada template tersedia</p>
            <p className="text-slate-500 text-sm mb-6">Segera hadir template premium berkualitas tinggi</p>
            <button 
              onClick={onBack} 
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
            >
              Jelajahi Kategori Lain
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              // 🔥 Gunakan discount_price jika ada, jika tidak pakai fake discount
              const displayPrice = product.discount_price || product.price;
              const originalPrice = product.discount_price ? product.price : Math.round(product.price * 1.5);
              const discountPercentage = product.discount_percentage || 
                Math.round(((originalPrice - displayPrice) / originalPrice) * 100);

              return (
                <div 
                  key={product.id} 
                  className="group relative flex flex-col justify-between border border-slate-800/50 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 hover:from-slate-900 hover:via-slate-900/90 hover:to-slate-900 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden backdrop-blur-sm hover:-translate-y-1"
                >
                  {/* Animated Gradient Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
                  </div>

                  {/* Enhanced Discount Badge */}
                  <div className="absolute top-0 right-0 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-bl-2xl blur-md opacity-60"></div>
                      <div className="relative bg-gradient-to-br from-red-600 to-red-700 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl shadow-xl flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        HEMAT {discountPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 space-y-5">
                    {/* Enhanced Icon Header */}
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                          <Monitor className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1 tracking-tight" title={product.name}>
                        {product.name}
                      </h2>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 min-h-[42px]">
                        {product.description || "Template premium siap pakai untuk website WordPress Anda. Ringan, SEO Friendly, dan mudah digunakan."}
                      </p>
                    </div>

                    {/* Enhanced Features */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-900/20 text-emerald-300 border border-emerald-700/30 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> 
                        Responsive
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-300 border border-blue-700/30 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-blue-400" /> 
                        SEO Ready
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-900/20 text-purple-300 border border-purple-700/30 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-purple-400" /> 
                        Fast Load
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Footer */}
                  <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/50">
                    {/* Price Section - UPDATED WITH REAL DISCOUNT */}
                    <div className="flex flex-col mb-5 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 line-through decoration-slate-600 decoration-2">
                          Rp {originalPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs font-bold text-red-100 bg-gradient-to-r from-red-600/40 to-red-700/40 px-2 py-1 rounded-md border border-red-600/30 shadow-sm">
                          -{discountPercentage}%
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5">
                        <span className="text-sm text-blue-400 font-semibold">Rp</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-blue-100 bg-clip-text text-transparent">
                          {displayPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.97] group/btn overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        <Zap className="w-4 h-4 fill-current relative z-10" />
                        <span className="relative z-10">Beli Sekarang</span>
                      </button>
                      
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border-2 border-slate-700/50 hover:border-blue-500/60 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300 active:scale-[0.97] shadow-sm hover:shadow-lg hover:shadow-blue-500/20"
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}