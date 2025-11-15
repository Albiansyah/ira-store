"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PaymentStatus = "processing" | "done" | "error";

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [message, setMessage] = useState<string>(
    "Sedang memproses pesanan dan menyiapkan akun untuk dikirim ke WhatsApp kamu..."
  );

  useEffect(() => {
    const orderIdFromQuery =
      searchParams.get("order_id") || searchParams.get("orderId");

    if (!orderIdFromQuery) {
      setStatus("error");
      setMessage(
        "Data transaksi tidak lengkap. Silakan kembali ke beranda dan cek riwayat order."
      );
      const t = setTimeout(() => router.push("/"), 5000);
      return () => clearTimeout(t);
    }

    const orderId = orderIdFromQuery;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      try {
        // Langsung anggap transaksi selesai dan proses order:
        // - ambil akun dari stok
        // - tandai is_used = true
        // - kirim WA lewat Fonnte
        await fetch("/api/orders/mark-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        setStatus("done");
        setMessage(
          "Pesanan kamu sedang diproses. Jika pembayaran berhasil, akun akan dikirim ke WhatsApp yang kamu input tadi."
        );

        // Jeda sebentar lalu balik ke home
        timeoutId = setTimeout(() => router.push("/"), 6000);
      } catch (err) {
        console.error("ThankYouPage run error:", err);
        setStatus("error");
        setMessage(
          "Terjadi kesalahan saat memproses pesanan. Jika saldo sudah terpotong tapi akun belum diterima, silakan hubungi admin."
        );
        timeoutId = setTimeout(() => router.push("/"), 6000);
      }
    }

    run();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, searchParams]);

  const statusLabel = (() => {
    switch (status) {
      case "processing":
        return "Memproses Pesanan...";
      case "done":
        return "Pesanan Diproses ✅";
      case "error":
        return "Terjadi Kesalahan ⚠️";
      default:
        return "";
    }
  })();

  const statusColor = (() => {
    switch (status) {
      case "processing":
        return "text-slate-200";
      case "done":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      default:
        return "text-slate-200";
    }
  })();

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
          <h1 className={`text-2xl md:text-3xl font-bold ${statusColor}`}>
            {statusLabel}
          </h1>
          <p className="text-sm md:text-base text-slate-300 whitespace-pre-line">
            {message}
          </p>
        </div>

        <p className="text-[11px] text-slate-500">
          Jangan tutup halaman ini dulu. Kamu akan diarahkan kembali ke beranda
          secara otomatis.
        </p>
      </div>
    </main>
  );
}
