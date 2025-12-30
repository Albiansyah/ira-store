'use client'
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 30,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 2;
          minutes = 30;
          seconds = 45;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Produk apa saja yang dijual di IRA STORE?",
      answer: "Kami menjual berbagai produk digital seperti Akun Gmail, E-book Premium, dan App Premium (coming soon). Semua produk dijamin original dan berkualitas."
    },
    {
      question: "Berapa lama waktu pengiriman setelah pembayaran?",
      answer: "Pengiriman otomatis dalam waktu kurang dari 1 menit setelah pembayaran berhasil. Produk langsung dikirim ke WhatsApp Anda."
    },
    {
      question: "Apakah perlu daftar akun dulu untuk membeli?",
      answer: "Tidak perlu! Anda cukup pilih produk, isi email dan nomor WhatsApp, lalu bayar. Sistem kami 100% otomatis tanpa registrasi."
    },
    {
      question: "Metode pembayaran apa saja yang tersedia?",
      answer: "Kami hanya menerima pembayaran melalui QRIS (scan QR untuk bayar). Mudah, cepat, dan support semua e-wallet & mobile banking!"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <section className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center mb-24 md:mb-32">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-medium">
                IRA STORE · Akun Siap Pakai
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-red-500/40 bg-red-500/10 text-red-300 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Promo berakhir dalam:</span>
                <span className="font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight font-poppins">
              Produk Digital Instan{" "}
              <span className="text-emerald-400">
                Serba Otomatis!
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed font-inter">
              Akses produk digital premium hanya dalam <span className="text-emerald-400 font-semibold">hitungan detik</span>. Mulai dari <span className="text-emerald-400 font-semibold">Rp 2.500</span> — bayar, langsung dapat. Tanpa antri, tanpa ribet!
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/products"
                className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20 font-inter"
              >
                Mulai Belanja
              </Link>

              <a
                href="https://wa.me/6285184657474"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/50 active:bg-slate-900 text-sm text-slate-200 transition-colors font-inter"
              >
                Hubungi CS
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <div className="px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-inter">
                ✅ Kirim otomatis via WA
              </div>
              <div className="px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-inter">
                ✅ Harga mulai Rp 2.500
              </div>
              <div className="px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-inter">
                ✅ Tanpa perlu daftar
              </div>
            </div>
          </div>

          <div className="relative mt-8 md:mt-0">
            <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-3xl opacity-50" />
            <div className="relative border border-slate-800 bg-slate-900/90 backdrop-blur rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-inter">Stok Terbatas</p>
                  <p className="text-lg font-bold text-emerald-400 font-poppins">127 Akun Tersisa</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-300 font-poppins">Paket Populer</p>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/40 font-inter font-medium">
                    🔥 Hot
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/60 hover:bg-slate-950/80 transition-colors">
                    <span className="text-slate-400 font-inter">1 Akun</span>
                    <span className="font-semibold text-slate-200 font-inter">Rp 2.500</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/60 hover:bg-slate-950/80 border border-amber-500/20 transition-colors">
                    <div>
                      <span className="text-slate-300 font-inter">10 Akun</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-inter">Hemat 0%</span>
                    </div>
                    <span className="font-semibold text-slate-200 font-inter">Rp 25.000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/40 transition-colors">
                    <div>
                      <span className="text-emerald-300 font-medium font-inter">50 Akun</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-inter">Best Value</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 line-through font-inter">Rp 150.000</div>
                      <span className="font-bold text-emerald-400 font-inter">Rp 125.000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 border-2 border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-blue-600 border-2 border-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-purple-400 to-purple-600 border-2 border-slate-900" />
                  </div>
                  <span className="text-xs text-slate-400 font-inter">47 orang beli hari ini</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 font-inter">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 font-poppins">Cara Kerja</h2>
            <p className="text-sm md:text-base text-slate-400 font-inter">Proses cepat dalam 3 langkah sederhana</p>
          </div>
          
          <div className="relative">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 
            
            from-transparent via-emerald-500/40 to-transparent" style={{width: 'calc(100% - 12rem)', left: '6rem'}} />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 relative">
              <div className="space-y-4 text-center">
                <div className="relative flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10 font-poppins">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 font-poppins">Pilih Paket</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-inter">
                    Pilih jumlah akun yang kamu butuhkan dari berbagai paket tersedia
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10 font-poppins">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 font-poppins">Bayar</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-inter">
                    Isi email & nomor WhatsApp, lalu lakukan pembayaran secara otomatis
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10 font-poppins">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 font-poppins">Terima Akun</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-inter">
                    Akun otomatis dikirim ke WhatsApp kamu dalam hitungan detik
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mt-24 md:mt-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 font-poppins">Testimoni Pelanggan</h2>
            <p className="text-sm md:text-base text-slate-400 font-inter">Apa kata mereka yang sudah belanja di IRA STORE</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="font-semibold text-slate-200 font-poppins">Ahmad Rizki</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-inter">
                "Cepat banget prosesnya! Baru bayar langsung dikirim ke WA. Harganya juga murah, recommended buat yang butuh akun cepat."
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold text-slate-200 font-poppins">Siti Nurhaliza</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-inter">
                "Sudah langganan di sini. Sistem otomatisnya memudahkan banget, gak perlu ribet kontak-kontakan. CS nya juga responsif!"
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                  B
                </div>
                <div>
                  <p className="font-semibold text-slate-200 font-poppins">Budi Santoso</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-inter">
                "Beli paket 50 akun untuk bisnis. Worth it banget! Semua akun work dengan baik. Terima kasih IRA STORE!"
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto mt-24 md:mt-32">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-emerald-500/10 to-blue-500/10 blur-2xl opacity-50" />
            <div className="relative border border-slate-800 bg-slate-900/80 backdrop-blur rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-poppins">
                Siap Mulai Belanja?
              </h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto font-inter">
                Dapatkan produk digital berkualitas dengan harga terjangkau. Proses cepat, aman, dan terpercaya.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/products"
                  className="px-8 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20 font-inter"
                >
                  Lihat Semua Produk
                </Link>
                <a
                  href="https://wa.me/6285184657474"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/50 active:bg-slate-900 text-sm text-slate-200 transition-colors font-inter"
                >
                  Tanya Sebelum Beli
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto mt-20 md:mt-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1 font-poppins">2.5k+</p>
              <p className="text-xs md:text-sm text-slate-400 font-inter">Akun Terjual</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1 font-poppins">1.2k+</p>
              <p className="text-xs md:text-sm text-slate-400 font-inter">Pelanggan Puas</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1 font-poppins">24/7</p>
              <p className="text-xs md:text-sm text-slate-400 font-inter">Support CS</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1 font-poppins">&lt;1 Min</p>
              <p className="text-xs md:text-sm text-slate-400 font-inter">Pengiriman</p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto mt-24 md:mt-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 font-poppins">Pertanyaan Umum</h2>
            <p className="text-sm md:text-base text-slate-400 font-inter">Jawaban untuk pertanyaan yang sering ditanyakan</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/80 transition-colors"
                >
                  <span className="font-semibold text-slate-200 font-poppins pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-sm text-slate-400 leading-relaxed font-inter">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <a
        href="https://wa.me/6285184657474"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50 group"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
      </a>
    </main>
  );
}