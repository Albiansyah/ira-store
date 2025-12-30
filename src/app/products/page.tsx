"use client";

import { useState } from "react";
import GmailProducts from "./gmail";
import EbookProducts from "./ebook";
import AppPremiumProducts from "./appPrem";
import TemplateProducts from "./templates"; // Import komponen Template

export default function ProductsPage() {
  // Update tipe state untuk menyertakan 'template'
  const [selectedCategory, setSelectedCategory] = useState<'gmail' | 'ebook' | 'app' | 'template' | null>(null);

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
                Pilih kategori yang sesuai kebutuhan. Dapatkan produk premium berkualitas tinggi!
              </p>
            </div>

            {/* Category Cards - Update Grid untuk 4 Item */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              
              {/* 1. Gmail Category */}
              <button
                onClick={() => setSelectedCategory('gmail')}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 hover:border-emerald-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30"
              >
                {/* Background Image dengan Gradient Overlay */}
                <div className="absolute inset-0">
                  {/* Gmail Background Pattern */}
                  <div className="absolute inset-0 bg-linear-to-br from-red-500 via-yellow-500 to-blue-500 opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 opacity-30 group-hover:opacity-40 transition-opacity" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor" className="text-white"/>
                    </svg>
                  </div>
                  {/* Lighter Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/40 backdrop-blur-sm"></div>
                </div>
                
                {/* Content */}
                <div className="relative flex flex-col justify-end p-6 pb-4 min-h-80">
                  <div className="space-y-1 text-left mb-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      Akun Gmail
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Akun Premium Fresh & Aman 100%
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-1.5 flex-1">
                        <p className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                          Klik Untuk Lihat Paket
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span>✓ Terverifikasi</span>
                          <span>•</span>
                          <span>✓ Instant</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all ml-3 shrink-0">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* 2. E-book Category */}
              <button
                onClick={() => setSelectedCategory('ebook')}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 opacity-30 group-hover:opacity-40 transition-opacity" viewBox="0 0 24 24" fill="none">
                      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor" className="text-white"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/40 backdrop-blur-sm"></div>
                </div>
                
                <div className="relative flex flex-col justify-end p-6 pb-4 min-h-80">
                  <div className="space-y-1 text-left mb-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      E-Book Premium
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Panduan Lengkap & To The Point 
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-1.5 flex-1">
                        <p className="text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                          Klik Untuk Lihat Paket
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span>✓ Kualitas HD</span>
                          <span>•</span>
                          <span>✓ Eksklusif</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center group-hover:bg-purple-500/30 transition-all ml-3 shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* 3. WP Templates Category (BARU) */}
              <button
                onClick={() => setSelectedCategory('template')}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-500 to-cyan-500 opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Icon Layout */}
                    <svg className="w-64 h-64 opacity-30 group-hover:opacity-40 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="text-white"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/40 backdrop-blur-sm"></div>
                </div>
                
                <div className="relative flex flex-col justify-end p-6 pb-4 min-h-80">
                  <div className="space-y-1 text-left mb-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      WP Templates
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Tema & Plugin Premium
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-1.5 flex-1">
                        <p className="text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                          Lihat Koleksi
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span>✓ Responsive</span>
                          <span>•</span>
                          <span>✓ Instant</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center group-hover:bg-blue-500/30 transition-all ml-3 shrink-0">
                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* 4. App Premium Category - Coming Soon (LOCKED) */}
              <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-700 opacity-70 cursor-not-allowed">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-cyan-500 to-teal-500 opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 opacity-30" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" className="text-white"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/40 backdrop-blur-sm"></div>
                </div>
                
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg animate-pulse">
                    SEGERA HADIR
                  </span>
                </div>
                
                <div className="relative flex flex-col justify-end p-6 pb-4 min-h-80">
                  <div className="space-y-1 text-left mb-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      App Premium
                    </h2>
                    <p className="text-sm text-slate-200 drop-shadow">
                      Akses Premium ke Aplikasi Terbaik
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-left space-y-1.5 flex-1">
                        <p className="text-sm font-bold text-slate-400">
                          Segera Hadir
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>✓ Full Access</span>
                          <span>•</span>
                          <span>✓ Update</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center ml-3 shrink-0">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Render komponen sesuai kategori yang dipilih */}
        {selectedCategory === 'gmail' && (
          <GmailProducts onBack={() => setSelectedCategory(null)} />
        )}

        {selectedCategory === 'ebook' && (
          <EbookProducts onBack={() => setSelectedCategory(null)} />
        )}
        
        {/* Render Template Component */}
        {selectedCategory === 'template' && (
          <TemplateProducts onBack={() => setSelectedCategory(null)} />
        )}

        {selectedCategory === 'app' && (
          <AppPremiumProducts onBack={() => setSelectedCategory(null)} />
        )}

      </div>
    </main>
  );
}