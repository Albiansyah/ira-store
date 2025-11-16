"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Pastikan path ini benar
import type { ProductRow } from "@/lib/types"; // Pastikan path ini benar
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext"; // <-- PENTING: Mengimpor hook keranjang

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'gmail' | 'ebook' | null>(null);

  // Ambil state & fungsi dari CartContext
  const {
    cart,
    addToCart,
    buyNow: buyNowContext, // 'buyNow' sudah ada di scope, jadi kita rename
    stockAvailable,
    totalUnitsInCart,
  } = useCart();

  const router = useRouter();

  // useEffect untuk load products dari Supabase (Ini tidak berubah)
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, unit_count, is_active")
        .order("unit_count", { ascending: true });

      if (error) {
        console.error("Load products error:", error);
        setError("Gagal mengambil data produk");
      } else {
        let all = (data || []) as ProductRow[];

        // SELALU tambahkan paket 100 dan 150 akun
        const has100 = all.some((p) => p.unit_count === 100);
        const has150 = all.some((p) => p.unit_count === 150);

        if (!has100) {
          all.push({
            id: "package-100",
            name: "Paket 100 Akun",
            price: 250000,
            unit_count: 100,
            is_active: true,
          } as ProductRow);
        }

        if (!has150) {
          all.push({
            id: "package-150",
            name: "Paket 150 Akun",
            price: 375000,
            unit_count: 150,
            is_active: true,
          } as ProductRow);
        }

        all.sort((a, b) => a.unit_count - b.unit_count);
        const active = all.filter((p: any) => p.is_active !== false);

        setProducts(active);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  // ❌ SEMUA useEffect & useMemo untuk cart/stock LOKAL DIHAPUS DARI SINI
  // ...karena sudah dihandle oleh CartContext

  // --- FUNGSI BARU (SESUAI REQUEST) ---

  /**
   * Panggil fungsi `addToCart` dari Context.
   * Tidak redirect, hanya menambah ke keranjang.
   */
  function handleAddToCart(product: ProductRow) {
    const success = addToCart(product);
    if (!success) {
      alert("Stok akun tidak cukup untuk menambah paket ini.");
    } else {
      // (Opsional) Anda bisa tambahkan notifikasi toast di sini
      console.log("Berhasil ditambah ke keranjang");
    }
  }

  /**
   * Panggil fungsi 'buyNow' dari Context.
   * Ini akan meng-overwrite keranjang & langsung redirect.
   */
  function handleBuyNow(product: ProductRow) {
    const success = buyNowContext(product);
    
    if (success) {
      setTimeout(() => {
        router.push("/checkout");
      }, 100);
    } else {
      alert("Stok akun tidak cukup untuk paket ini.");
    }
  }

  // --- Fungsi helper (TETAP SAMA) ---
  function getDiscountPercentage(unitCount: number): number {
    if (unitCount >= 150) return 25;
    if (unitCount >= 100) return 20;
    if (unitCount >= 50) return 15;
    if (unitCount >= 20) return 10;
    if (unitCount >= 10) return 5;
    return 0;
  }

  function getBadge(unitCount: number) {
    if (unitCount >= 150)
      return { label: "HEMAT 25%", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
    if (unitCount >= 100)
      return { label: "HEMAT 20%", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" };
    if (unitCount >= 50)
      return { label: "HEMAT 15%", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    if (unitCount >= 20)
      return { label: "HEMAT 10%", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    if (unitCount >= 10)
      return { label: "HEMAT 5%", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    return null;
  }

  // --- RENDER ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* Tampilan Awal - Pilih Kategori */}
        {selectedCategory === null && (
          <>
            {/* Header Halaman */}
            <div className="mb-8 space-y-3 text-center">
              <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                  🎯 Promo Bundling · Makin Banyak Makin Hemat
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold">Pilih Kategori Produk</h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto">
                Pilih kategori yang sesuai kebutuhan. Dapatkan akun Gmail berkualitas atau e-book panduan terbaik!
              </p>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Gmail Category */}
              <button
                onClick={() => setSelectedCategory('gmail')}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 hover:border-emerald-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30 h-80"
              >
                {/* Background Image dengan Gradient Overlay */}
                <div className="absolute inset-0">
                  {/* Simulated Gmail Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 opacity-20 group-hover:opacity-30 transition-opacity" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor" className="text-white"/>
                    </svg>
                  </div>
                  {/* Dark Overlay untuk Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/70 backdrop-blur-sm"></div>
                </div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-8 space-y-4">
                  {/* Header & Sub Header - Di luar kontainer */}
                  <div className="space-y-1 text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      Akun Gmail
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Akun Premium Fresh & Aman 100%
                    </p>
                  </div>
                  
                  {/* Kontainer untuk CTA & Details */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-2 flex-1">
                        <p className="text-base font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                          Klik Untuk Lihat Paket
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span>✓ Terverifikasi</span>
                          <span>•</span>
                          <span>✓ Garansi</span>
                          <span>•</span>
                          <span>✓ Instant</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all ml-4">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* E-book Category - Coming Soon */}
              <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 opacity-70 cursor-not-allowed h-80">
                {/* Background Image dengan Gradient Overlay */}
                <div className="absolute inset-0">
                  {/* Simulated E-book Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 opacity-20" viewBox="0 0 24 24" fill="none">
                      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor" className="text-white"/>
                    </svg>
                  </div>
                  {/* Dark Overlay untuk Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/70 backdrop-blur-sm"></div>
                </div>
                
                {/* Coming Soon Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg animate-pulse">
                    SEGERA HADIR
                  </span>
                </div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-8 space-y-4">
                  {/* Header & Sub Header - Di luar kontainer */}
                  <div className="space-y-1 text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      E-Book Premium
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Segala Kebutuhan Dalam Bacaan yang Singkat & To The Point 
                    </p>
                  </div>
                  
                  {/* Kontainer untuk CTA & Details */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-2 flex-1">
                        <p className="text-base font-bold text-slate-400">
                          Segera Hadir
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>✓ Kualitas HD</span>
                          <span>•</span>
                          <span>✓ Garansi Seumur Hidup</span>
                          <span>•</span>
                          <span>✓ Ekslusif</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center ml-4">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tampilan Produk Gmail - Muncul setelah pilih kategori */}
        {selectedCategory === 'gmail' && (
          <>
            {/* Header dengan tombol back */}
            <div className="mb-8 space-y-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-emerald-500 hover:bg-slate-900 text-sm transition-all mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Kategori
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                  🎯 Promo Bundling · Makin Banyak Makin Hemat
                </span>
                {/* Tampilkan stok dari Context */}
                {stockAvailable !== null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-slate-700 text-slate-300 bg-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Stok: {stockAvailable} akun tersedia
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Paket Akun Gmail</h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl">
                Pilih paket yang sesuai kebutuhan. Semakin banyak beli, semakin hemat!
                Akun dikirim otomatis ke WhatsApp setelah pembayaran.
              </p>
            </div>

            {/* Konten Produk */}
            <section className="space-y-5">
              {/* Status Loading */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
                  <p className="text-slate-400 text-sm mt-3">Memuat produk...</p>
                </div>
              )}

              {/* Status Error */}
              {error && (
                <div className="border border-red-900/50 bg-red-950/30 rounded-xl p-4 text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Status Produk Kosong */}
              {!loading && !error && products.length === 0 && (
                <div className="border border-slate-800 bg-slate-900 rounded-xl p-8 text-center">
                  <p className="text-slate-400">Belum ada produk tersedia.</p>
                </div>
              )}

              {/* Status Stok Habis (dari Context) */}
              {!loading && !error && stockAvailable === 0 && products.length > 0 && (
                <div className="border border-yellow-900/50 bg-yellow-950/30 rounded-xl p-4 text-center">
                  <p className="text-yellow-400 text-sm font-semibold">
                    ⚠️ Stok akun sedang habis. Silakan hubungi admin untuk informasi lebih lanjut.
                  </p>
                </div>
              )}

              {/* Grid Produk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {!loading &&
                  !error &&
                  products.map((p) => {
                    // Cek stok (pakai data dari context)
                    const isOutOfStock = stockAvailable !== null && stockAvailable === 0;
                    // Cek apakah *unit produk ini* > stok total
                    const notEnoughStockForThisPackage = stockAvailable !== null && p.unit_count > stockAvailable;
                    
                    const disabled = isOutOfStock || notEnoughStockForThisPackage;
                    
                    // Cek apakah item ada di keranjang (dari context)
                    const itemInCart = cart.find((item) => item.productId === p.id);

                    const pricePerUnit = p.price / p.unit_count;
                    const badge = getBadge(p.unit_count);
                    const discount = getDiscountPercentage(p.unit_count);
                    const isPopular = p.unit_count === 50 || p.unit_count === 100;

                    return (
                      <div
                        key={p.id}
                        className={`relative border rounded-xl p-5 flex flex-col justify-between transition-all ${
                          disabled
                            ? "bg-slate-950/60 opacity-50 border-slate-800"
                            : isPopular
                            ? "bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-500/5"
                        }`}
                      >
                        {/* Badge Paling Laris & Hemat */}
                        {isPopular && !disabled && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-lg">
                            🔥 PALING LARIS
                          </span>
                        )}
                        {badge && !disabled && (
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}

                        {/* Info Produk */}
                        <div className="space-y-3 mt-2">
                          <div>
                            <h2 className="font-bold text-lg">{p.name}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {p.unit_count} akun siap pakai
                            </p>
                          </div>

                          {/* Info Diskon */}
                          {discount > 0 && !disabled && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 line-through">
                                Rp {Math.round(p.price / (1 - discount / 100)).toLocaleString("id-ID")}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                                -{discount}%
                              </span>
                            </div>
                          )}

                          <div className="border-t border-slate-800 pt-3">
                            {/* Info Harga */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-emerald-400">
                                Rp {p.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Rp {pricePerUnit.toLocaleString("id-ID")} per akun
                            </p>
                            
                            {/* Indikator di keranjang */}
                            {itemInCart && !disabled && (
                              <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <span className="text-sm font-bold text-emerald-300">
                                  {itemInCart.quantity}x di keranjang
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info Hemat */}
                          {!disabled && p.unit_count >= 20 && (
                            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-2">
                              <p className="text-xs text-emerald-300">
                                ✅ Hemat Rp {Math.round((pricePerUnit * 0.15) * p.unit_count).toLocaleString("id-ID")} dari harga normal
                              </p>
                            </div>
                          )}
                          
                          {/* Info Stok Tidak Cukup */}
                          {disabled && (
                            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-2">
                              <p className="text-xs text-red-400">
                                ⚠️ Stok tidak cukup untuk paket ini
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleBuyNow(p)}
                            disabled={disabled}
                            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-bold transition-all hover:scale-105"
                          >
                            Beli Sekarang
                          </button>
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={disabled}
                            className="w-11 h-11 rounded-lg border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                            title="Tambah ke keranjang"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </>
        )}

      </div>
    </main>
  );
}