"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPrice,
    totalUnitsInCart,
    stockAvailable,
    isCartLoading,
  } = useCart();

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const contactFormRef = useRef<HTMLDivElement>(null);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    const success = updateQuantity(productId, newQuantity);
    if (!success) {
      alert("Stok tidak cukup untuk menambah jumlah.");
    }
  };

  const handleManualQuantityChange = (productId: string, value: string) => {
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) {
      const success = updateQuantity(productId, 1);
      if (!success) alert("Stok tidak cukup.");
      return;
    }
    handleQuantityChange(productId, newQuantity);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (cart.length === 0) {
      setError("Keranjang kosong. Silakan pilih produk terlebih dahulu.");
      return;
    }
    if (!buyerEmail || !buyerPhone) {
      setError("Email dan nomor WhatsApp wajib diisi.");
      // Scroll ke form kontak
      if (contactFormRef.current) {
        contactFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    
    if (stockAvailable !== null && totalUnitsInCart > stockAvailable) {
      setError("Stok tidak cukup untuk jumlah pesanan Anda. Harap kurangi item di keranjang.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail,
          buyerPhone,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data?.error || "Gagal memproses pesanan. Silakan coba lagi."
        );
      } else {
        clearCart();

        const paymentUrl: string | undefined = data.paymentUrl;

        if (paymentUrl) {
          const params = new URLSearchParams({
            orderId: String(data.orderId),
            amount: String(data.grandTotal),
            paymentUrl,
          });
          router.push(`/thank-you?${params.toString()}`);
        } else {
          setMessage(
            `Pesanan berhasil dibuat. ID: ${data.orderId}. Total item: ${
              data.totalUnitsNeeded
            }, Total pembayaran: Rp ${
              typeof data.grandTotal === "number"
                ? data.grandTotal.toLocaleString("id-ID")
                : data.grandTotal
            }.`
          );
        }
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (isCartLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          <p className="text-slate-400 text-sm mt-3">Memuat keranjang...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        
        {/* Header yang lebih menarik */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Lengkapi informasi di bawah ini untuk menyelesaikan pesanan Anda
          </p>
        </div>

        {/* Layout Grid untuk Desktop - 3 Kolom */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Kolom 1: Ringkasan Pesanan (Paling Kanan di Desktop) */}
          <div className="lg:col-span-1 lg:order-3">
            <div className="border border-slate-800/50 rounded-2xl p-6 bg-slate-900/30 backdrop-blur-sm sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-emerald-400 text-sm">1</span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-200">
                    Ringkasan Pesanan
                  </h2>
                </div>
                <button
                  onClick={() => clearCart()}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Kosongkan
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-5xl opacity-50">🛒</div>
                  <p className="text-slate-400">Keranjang Anda masih kosong</p>
                  <Link
                    href="/products"
                    className="inline-block px-6 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all font-medium text-sm"
                  >
                    Lihat Produk
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 truncate text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {item.unitCount} × {item.quantity}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleManualQuantityChange(item.productId, e.target.value)}
                              className="w-10 h-6 text-center bg-slate-800 border border-slate-700 rounded-md text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-xs"
                            >
                              +
                            </button>
                            
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1 ml-auto"
                              title="Hapus item"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-slate-100 text-sm">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            @ Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total dan Tombol Aksi */}
                  <div className="pt-4 border-t border-slate-800/50 space-y-3 mt-4">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Total Akun</span>
                      <span className="font-semibold text-slate-200">
                        {totalUnitsInCart}
                      </span>
                    </div>
                    
                    {stockAvailable !== null && totalUnitsInCart > stockAvailable && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 rounded-lg px-3 py-2">
                        <span>⚠️</span>
                        <span>Stok tidak cukup! (Tersisa: {stockAvailable})</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-slate-200">Total Pembayaran</span>
                      <span className="font-bold text-2xl text-emerald-400">
                        Rp {totalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={
                        loading || 
                        cart.length === 0 || 
                        (stockAvailable !== null && totalUnitsInCart > stockAvailable)
                      }
                      className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Memproses...
                        </span>
                      ) : (
                        "Lanjutkan Pembayaran"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div className="flex items-start gap-3 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 mt-8">
                  <span className="text-lg">✅</span>
                  <p>{message}</p>
                </div>
            )}
          </div>

          {/* Kolom 2 & 3: Informasi Kontak dan Keuntungan (Kiri) */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            
            {/* Informasi Kontak */}
            <div ref={contactFormRef} className="border border-slate-800/50 rounded-2xl p-6 bg-slate-900/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-400 text-sm">2</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-200">
                  Informasi Kontak
                </h2>
              </div>

              <form className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="628123456789"
                    required
                  />
                  <p className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">💡</span>
                    <span>
                      Detail pesanan akan dikirim otomatis ke WhatsApp Anda setelah pembayaran dikonfirmasi.
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                    <span className="text-lg">⚠️</span>
                    <p>{error}</p>
                  </div>
                )}

                <Link
                  href="/products"
                  className="w-full text-center py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 font-bold text-sm transition-all block"
                >
                  Tambah Produk Lain
                </Link>
              </form>
            </div>

            {/* Informasi Tambahan */}
            <div className="border border-slate-800/50 rounded-2xl p-6 bg-slate-900/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-400 text-sm">3</span>
                </div>
                <h3 className="font-semibold text-slate-200">Keuntungan Berbelanja</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>Garansi akun 100% original</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>Pengiriman instan setelah pembayaran</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>Support customer 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>Proses checkout cepat dan mudah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}