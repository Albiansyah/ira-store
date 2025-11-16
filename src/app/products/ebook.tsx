"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ProductRow } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface EbookProductsProps {
  onBack: () => void;
}

export default function EbookProducts({ onBack }: EbookProductsProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    cart,
    addToCart,
    buyNow: buyNowContext,
  } = useCart();

  const router = useRouter();

  // Load e-book products
  useEffect(() => {
    async function loadEbooks() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, unit_count, is_active, product_type, file_url")
        .eq("product_type", "ebook")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Load ebooks error:", error);
        setError("Gagal mengambil data e-book");
      } else {
        let all = (data || []) as ProductRow[];

        // BUNDLE: Tambahkan paket bundle e-book
        const hasBundle3 = all.some((p) => p.unit_count === 3);
        const hasBundle5 = all.some((p) => p.unit_count === 5);

        if (!hasBundle3) {
          all.push({
            id: "bundle-3",
            name: "Paket Bundle 3 E-book",
            description: "Pilih 3 e-book favorit dengan harga spesial",
            price: 75000, // Adjust sesuai kebutuhan
            unit_count: 3,
            is_active: true,
            product_type: "ebook",
          } as ProductRow);
        }

        if (!hasBundle5) {
          all.push({
            id: "bundle-5",
            name: "Paket Bundle 5 E-book",
            description: "Pilih 5 e-book favorit dengan harga super hemat",
            price: 120000, // Adjust sesuai kebutuhan
            unit_count: 5,
            is_active: true,
            product_type: "ebook",
          } as ProductRow);
        }

        all.sort((a, b) => a.price - b.price);
        setProducts(all);
      }
      setLoading(false);
    }
    loadEbooks();
  }, []);

  // Handler untuk menambah ke keranjang
  function handleAddToCart(product: ProductRow) {
    const success = addToCart(product);
    if (!success) {
      alert("Gagal menambahkan ke keranjang.");
    } else {
      console.log("Berhasil ditambah ke keranjang");
    }
  }

  // Handler untuk beli sekarang
  function handleBuyNow(product: ProductRow) {
    const success = buyNowContext(product);
    
    if (success) {
      setTimeout(() => {
        router.push("/checkout");
      }, 100);
    } else {
      alert("Gagal memproses pembelian.");
    }
  }

  // Fungsi helper untuk menghitung persentase diskon
  function getDiscountPercentage(unitCount: number): number {
    if (unitCount >= 5) return 30;
    if (unitCount >= 3) return 20;
    return 0;
  }

  // Fungsi helper untuk mendapatkan badge
  function getBadge(product: ProductRow) {
    const { unit_count, price } = product;
    
    if (unit_count >= 5)
      return { label: "HEMAT 30%", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
    if (unit_count >= 3)
      return { label: "HEMAT 20%", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" };
    if (price >= 50000)
      return { label: "PREMIUM", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    if (price <= 30000)
      return { label: "BEST VALUE", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    return null;
  }

  // Fungsi untuk cek apakah produk populer
  function isPopular(product: ProductRow): boolean {
    const { unit_count, price } = product;
    // Bundle 3 atau e-book dengan harga sweet spot
    return unit_count === 3 || (price >= 35000 && price <= 45000);
  }

  return (
    <>
      {/* Header dengan tombol back */}
      <div className="mb-8 space-y-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-purple-500 hover:bg-slate-900 text-sm transition-all mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Kategori
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-purple-500/40 text-purple-300 bg-purple-500/10">
            📚 E-Book Premium · Bundle Hemat Tersedia
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-slate-700 text-slate-300 bg-slate-900">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            Download Instan · Akses Selamanya
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">E-Book Premium</h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          Koleksi e-book premium dengan panduan lengkap dan to the point. Download langsung setelah pembayaran!
          Semakin banyak beli, semakin hemat!
        </p>
      </div>

      {/* Konten Produk */}
      <section className="space-y-5">
        {/* Status Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />
            <p className="text-slate-400 text-sm mt-3">Memuat e-book...</p>
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
          <div className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900 rounded-2xl p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/20 border-2 border-purple-500/50">
                <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="none">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-300">Segera Hadir!</h2>
                <p className="text-slate-300">Kami sedang menyiapkan koleksi e-book premium terbaik untuk Anda</p>
              </div>
            </div>
          </div>
        )}

        {/* Grid E-book */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((ebook) => {
              // Cek apakah item ada di keranjang
              const itemInCart = cart.find((item) => item.productId === ebook.id);
              
              const pricePerUnit = ebook.unit_count > 0 ? ebook.price / ebook.unit_count : ebook.price;
              const badge = getBadge(ebook);
              const discount = getDiscountPercentage(ebook.unit_count);
              const popular = isPopular(ebook);
              const isBundle = ebook.unit_count > 1;

              return (
                <div
                  key={ebook.id}
                  className={`relative border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    popular
                      ? "bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-purple-500/5"
                  }`}
                >
                  {/* Badge Paling Laris */}
                  {popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500 text-slate-950 shadow-lg">
                      🔥 PALING LARIS
                    </span>
                  )}
                  
                  {/* Badge Hemat/Premium */}
                  {badge && (
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}

                  {/* Icon E-book */}
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none">
                      {isBundle ? (
                        // Icon untuk bundle (multiple books)
                        <>
                          <path d="M19 2H9c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor" opacity="0.6"/>
                          <path d="M16 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                        </>
                      ) : (
                        // Icon untuk single e-book
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                      )}
                    </svg>
                  </div>

                  {/* Info Produk */}
                  <div className="space-y-3 mt-2">
                    <div>
                      <h2 className="font-bold text-lg text-slate-100 mb-2">{ebook.name}</h2>
                      {ebook.description && (
                        <p className="text-xs text-slate-400 line-clamp-3">{ebook.description}</p>
                      )}
                      {!isBundle && (
                        <p className="text-xs text-slate-500 mt-1">
                          Format: PDF Berkualitas HD
                        </p>
                      )}
                    </div>

                    {/* Info Diskon untuk Bundle */}
                    {discount > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 line-through">
                          Rp {Math.round(ebook.price / (1 - discount / 100)).toLocaleString("id-ID")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                          -{discount}%
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-800 pt-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-purple-400">
                          Rp {ebook.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      
                      {/* Harga per unit */}
                      {ebook.unit_count > 0 && (
                        <p className="text-xs text-slate-500">
                          Rp {pricePerUnit.toLocaleString("id-ID")} per {isBundle ? "e-book" : "item"}
                        </p>
                      )}
                      
                      {/* Indikator di keranjang */}
                      {itemInCart && (
                        <div className="mt-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                          <span className="text-sm font-bold text-purple-300">
                            {itemInCart.quantity}x di keranjang
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Keuntungan */}
                    <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-purple-300 flex items-center gap-1">
                        <span>✓</span> Download Instan Setelah Bayar
                      </p>
                      <p className="text-xs text-purple-300 flex items-center gap-1">
                        <span>✓</span> Akses Selamanya
                      </p>
                      <p className="text-xs text-purple-300 flex items-center gap-1">
                        <span>✓</span> {isBundle ? `Pilih ${ebook.unit_count} E-book Favorit` : "Konten Eksklusif & Premium"}
                      </p>
                      {!isBundle && (
                        <p className="text-xs text-purple-300 flex items-center gap-1">
                          <span>✓</span> Update Gratis (Jika Ada)
                        </p>
                      )}
                    </div>

                    {/* Info Hemat untuk Bundle */}
                    {isBundle && discount > 0 && (
                      <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-2">
                        <p className="text-xs text-purple-300">
                          💰 Hemat Rp {Math.round((pricePerUnit * discount / 100) * ebook.unit_count).toLocaleString("id-ID")} dari harga normal
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleBuyNow(ebook)}
                      className="flex-1 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                      Beli Sekarang
                    </button>
                    <button
                      onClick={() => handleAddToCart(ebook)}
                      className="w-11 h-11 rounded-lg border border-slate-700 hover:border-purple-500 hover:bg-slate-800 transition-all flex items-center justify-center"
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
        )}
      </section>
    </>
  );
}