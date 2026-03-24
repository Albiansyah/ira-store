// src/app/affiliate/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Copy, Wallet, ArrowRightLeft, LogOut, CheckCircle, AlertCircle } from "lucide-react";

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  balance: number;
  status: string;
}

export default function AffiliatePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  
  // Form States
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Cek apakah sudah login (via localStorage) saat halaman dimuat
  useEffect(() => {
    const savedAffiliate = localStorage.getItem("affiliate_data");
    if (savedAffiliate) {
      setAffiliate(JSON.parse(savedAffiliate));
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const action = isRegistering ? "register" : "login";

    try {
      const res = await fetch("/api/affiliates/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, name, whatsapp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      // Simpan sesi login ke Local Storage
      localStorage.setItem("affiliate_data", JSON.stringify(data.affiliate));
      setAffiliate(data.affiliate);
      setIsLoggedIn(true);
    } catch (err) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("affiliate_data");
    setAffiliate(null);
    setIsLoggedIn(false);
  };

  const copyToClipboard = () => {
    if (!affiliate) return;
    const link = `https://ira-store.web.id/?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ==========================================
  // VIEW: TAMPILAN DASHBOARD (JIKA SUDAH LOGIN)
  // ==========================================
  if (isLoggedIn && affiliate) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Halo, {affiliate.name}! 👋</h1>
              <p className="text-slate-400 text-sm mt-1">Selamat datang di Dashboard Affiliate Ira Store</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Saldo */}
            <div className="bg-linear-to-br from-emerald-600 to-emerald-900 border border-emerald-500/30 p-6 rounded-2xl shadow-lg shadow-emerald-900/20">
              <div className="flex items-center gap-3 text-emerald-100 mb-4">
                <Wallet className="w-6 h-6" />
                <h3 className="font-medium text-lg">Saldo Komisi Aktif</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-6">
                {formatRupiah(affiliate.balance)}
              </p>
              <button 
                onClick={() => alert("Fitur penarikan (withdraw) akan segera hadir!")}
                className="w-full py-3 bg-white text-emerald-700 hover:bg-slate-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-5 h-5" /> Tarik Saldo
              </button>
            </div>

            {/* Kartu Link Referral */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-medium text-slate-300 mb-2">Link Referral Anda</h3>
              <p className="text-sm text-slate-500 mb-4">
                Bagikan link ini. Anda akan mendapatkan komisi 10% dari setiap pembelian yang menggunakan link ini.
              </p>
              
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-700 rounded-xl mb-4">
                <code className="flex-1 text-sm text-emerald-400 overflow-x-auto whitespace-nowrap">
                  https://ira-store.web.id/?ref={affiliate.referralCode}
                </code>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
                  title="Copy Link"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-300 leading-relaxed">
                  Kode unik Anda adalah <strong className="text-white">{affiliate.referralCode}</strong>. Sistem kami secara otomatis melacak pembeli dari link Anda.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW: FORM LOGIN / REGISTER
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-linear-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Program Mitra Ira Store
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isRegistering ? "Daftar sekarang dan mulai hasilkan uang" : "Masuk ke dashboard affiliate Anda"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="08123456789"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="email@anda.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-xl font-bold transition-all text-white"
          >
            {loading ? "Memproses..." : isRegistering ? "Daftar Menjadi Mitra" : "Masuk Dashboard"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRegistering ? "Sudah punya akun? " : "Belum mendaftar? "}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
          >
            {isRegistering ? "Login di sini" : "Daftar di sini"}
          </button>
        </div>
      </div>
    </main>
  );
}