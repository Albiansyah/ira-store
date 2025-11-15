import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* Hero - Grid 2 kolom */}
        <section className="grid md:grid-cols-2 gap-12 items-center mb-32">
          {/* Kiri - Text */}
          <div className="space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
              IRA STORE · Akun Siap Pakai
            </span>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Beli Akun Gmail,
              <span className="block text-emerald-400">
                Langsung ke WhatsApp.
              </span>
            </h1>

            <p className="text-lg text-slate-400">
              Mulai dari <span className="text-emerald-400 font-semibold">Rp 2.500</span> per akun. Pilih paket, bayar, terima akun otomatis di WhatsApp. 
              Tanpa ribet, tanpa daftar.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/products"
                className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
              >
                Mulai Belanja
              </Link>

              <Link
                href="/admin/login"
                className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-sm text-slate-200 transition-colors"
              >
                Masuk
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                ✅ Kirim otomatis via WA
              </div>
              <div className="px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                ✅ Harga mulai Rp 2.500
              </div>
              <div className="px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                ✅ Tanpa perlu daftar
              </div>
            </div>
          </div>

          {/* Kanan - Visual Card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-3xl opacity-60" />
            <div className="relative border border-slate-800 bg-slate-900/80 backdrop-blur rounded-2xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Stok Terbatas</p>
                  <p className="text-lg font-bold text-emerald-400">127 Akun Tersisa</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-300">Paket Populer</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/40">
                    🔥 Hot
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60">
                    <span className="text-slate-400">1 Akun</span>
                    <span className="font-semibold text-slate-200">Rp 2.500</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-amber-500/20">
                    <div>
                      <span className="text-slate-300">10 Akun</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Hemat 0%</span>
                    </div>
                    <span className="font-semibold text-slate-200">Rp 25.000</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40">
                    <div>
                      <span className="text-emerald-300 font-medium">50 Akun</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Best Value</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 line-through">Rp 150.000</div>
                      <span className="font-bold text-emerald-400">Rp 125.000</span>
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
                  <span className="text-xs text-slate-400">47 orang beli hari ini</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Steps dengan Flow Line */}
        <section className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-2">Cara Kerja</h2>
            <p className="text-sm text-slate-400">Proses cepat dalam 3 langkah sederhana</p>
          </div>
          
          <div className="relative">
            {/* Flow Line - Hidden di mobile */}
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500/40 via-emerald-500/40 to-emerald-500/40" style={{width: 'calc(100% - 12rem)', left: '6rem'}} />
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Pilih Paket</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Pilih jumlah akun yang kamu butuhkan dari berbagai paket tersedia
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bayar</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Isi email & nomor WhatsApp, lalu lakukan pembayaran secara otomatis
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-bold text-lg relative z-10">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Terima Akun</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Akun otomatis dikirim ke WhatsApp kamu dalam hitungan detik
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <span>© {new Date().getFullYear()} · IRA STORE</span>
        </footer>
      </div>
    </main>
  );
}