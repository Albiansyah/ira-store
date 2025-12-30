"use client";

import { useState, useRef, useEffect } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const contactFormRef = useRef<HTMLDivElement>(null);

  // Validasi email real-time
  useEffect(() => {
    if (buyerEmail && !buyerEmail.includes("@")) {
      setEmailError("Format email tidak valid");
    } else {
      setEmailError(null);
    }
  }, [buyerEmail]);

  // Validasi nomor WA real-time
  useEffect(() => {
    if (!buyerPhone) {
      setPhoneError(null);
      return;
    }

    const cleanPhone = buyerPhone.replace(/\D/g, "");

    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      setPhoneError("Nomor WhatsApp terlalu pendek (minimal 10 digit)");
      return;
    }

    if (cleanPhone.startsWith("62")) {
      if (cleanPhone.length < 12) {
        setPhoneError("Nomor WhatsApp tidak valid. Format: 628123456789");
      } else {
        setPhoneError(null);
      }
    } else if (cleanPhone.startsWith("0")) {
      if (cleanPhone.length < 11) {
        setPhoneError("Nomor WhatsApp tidak valid. Format: 08123456789");
      } else {
        setPhoneError(null);
      }
    } else if (cleanPhone.startsWith("8")) {
      if (cleanPhone.length < 10) {
        setPhoneError("Nomor WhatsApp tidak valid. Format: 8123456789");
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError("Nomor WhatsApp harus diawali 08, +62, 62, atau 8");
    }
  }, [buyerPhone]);

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
    // Hapus karakter non-digit
    const cleanValue = value.replace(/\D/g, "");
    
    if (cleanValue === "") {
      // Jika kosong, set ke 1
      updateQuantity(productId, 1);
      return;
    }
    
    const newQuantity = parseInt(cleanValue);
    
    if (newQuantity < 1) {
      updateQuantity(productId, 1);
      return;
    }
    
    const success = updateQuantity(productId, newQuantity);
    if (!success) {
      alert("Stok tidak cukup untuk jumlah yang diinginkan.");
    }
  };

  const handleContinueToReview = () => {
    setError(null);

    if (!buyerEmail || !buyerEmail.includes("@")) {
      setError("Masukkan alamat email yang valid");
      return;
    }

    if (!buyerPhone) {
      setError("Masukkan nomor WhatsApp Anda");
      return;
    }

    if (phoneError) {
      setError(phoneError);
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Keranjang kosong. Silakan pilih produk terlebih dahulu.");
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
        setLoading(false);
        return;
      }

      const paymentUrl: string | undefined = data.paymentUrl;

      if (paymentUrl) {
        clearCart();
        window.location.href = paymentUrl;
      } else {
        setError("Tidak ada URL pembayaran. Hubungi admin.");
        setLoading(false);
      }

    } catch (err: any) {
      console.error("Checkout error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 1 ? 'bg-emerald-500/20 border-2 border-emerald-400' : 'bg-slate-800 border-2 border-slate-700'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Informasi Kontak</span>
            </div>
            
            <div className={`h-0.5 w-12 ${step === 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 2 ? 'bg-emerald-500/20 border-2 border-emerald-400' : 'bg-slate-800 border-2 border-slate-700'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Review & Bayar</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Informasi Kontak */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">
                Informasi Kontak
              </h1>
              <p className="text-sm text-slate-400">
                Kami akan mengirim detail akun ke kontak Anda
              </p>
            </div>

            <div ref={contactFormRef} className="border border-slate-800 rounded-xl p-6 bg-slate-900/50 space-y-5">
              
              {/* Email Input */}
              <div className="space-y-2">
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
                  className={`w-full bg-slate-950 border ${emailError ? 'border-red-500/50' : 'border-slate-700'} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                  placeholder="contoh@email.com"
                  required
                />
                {emailError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠️</span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* WhatsApp Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className={`w-full bg-slate-950 border ${phoneError ? 'border-red-500/50' : 'border-slate-700'} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                  placeholder="628123456789 atau 08123456789"
                  required
                />
                {phoneError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠️</span>
                    {phoneError}
                  </p>
                )}
                <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-blue-300 font-medium flex items-center gap-1">
                    <span>💡</span>
                    Format nomor yang diterima:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-0.5 ml-5">
                    <li>• 08123456789 (dengan 0)</li>
                    <li>• 628123456789 (dengan 62)</li>
                    <li>• 8123456789 (tanpa 0 atau 62)</li>
                    <li>• +628123456789 (dengan +62)</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                  <span className="text-base">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleContinueToReview}
                disabled={!buyerEmail || !buyerPhone || !!phoneError || !!emailError}
                className="w-full py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed font-semibold text-sm transition-all"
              >
                Lanjutkan ke Review Pesanan
              </button>

              <Link
                href="/products"
                className="w-full text-center py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 font-medium text-sm transition-all block"
              >
                Kembali ke Produk
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: Review Order */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Contact Info Summary */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">
                  Informasi Kontak
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Ubah
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {buyerEmail}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {buyerPhone}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/50">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-200">
                  Ringkasan Pesanan
                </h2>
                <Link
                  href="/products"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Tambah Item
                </Link>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl opacity-50">🛒</div>
                  <p className="text-slate-400 text-sm">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/30"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100 text-sm mb-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.unitCount} akun × {item.quantity} paket
                        </p>
                        
                        {/* Quantity Control - IMPROVED WITH MANUAL INPUT */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          {/* Manual Input Field */}
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) => handleManualQuantityChange(item.productId, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-16 h-8 text-center bg-slate-900 border border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                          />
                          
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 ml-auto"
                            title="Hapus dari keranjang"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  <div className="pt-4 border-t border-slate-800 space-y-3">
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
                      <span className="font-semibold text-slate-200 text-base">Total Pembayaran</span>
                      <span className="font-bold text-2xl text-emerald-400">
                        Rp {totalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                <span className="text-base">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={
                  loading || 
                  cart.length === 0 || 
                  (stockAvailable !== null && totalUnitsInCart > stockAvailable)
                }
                className="w-full py-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed font-bold text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses Pembayaran...
                  </span>
                ) : (
                  "Bayar Sekarang"
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 font-medium text-sm transition-all"
              >
                Kembali ke Informasi Kontak
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/50">
              <h3 className="font-semibold text-slate-200 text-sm mb-3">Keuntungan Berbelanja</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Garansi 100% Original</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Pengiriman Instan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Support 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Pembayaran Aman</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}