// src/app/thank-you/page.tsx
"use client";

// Gak perlu useEffect, useState, useRouter, useSearchParams
// Hapus SEMUA import itu

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40" />
            <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative h-full w-full flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-400">
            Pembayaran Diterima ✅
          </h1>
          <p className="text-sm md:text-base text-slate-300 whitespace-pre-line">
            Terima kasih! Pesanan kamu sedang diproses. Akun akan segera dikirim ke WhatsApp kamu secara otomatis.
          </p>
        </div>

        <p className="text-[11px] text-slate-500">
          Silakan cek WhatsApp kamu. Kamu bisa tutup halaman ini.
        </p>
      </div>
    </main>
  );
}