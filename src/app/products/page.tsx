"use client";

import { useState } from "react";
import GmailProducts from "./gmail";
import EbookProducts from "./ebook";
import AppPremiumProducts from "./appPrem";
import TemplateProducts from "./templates";

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'gmail' | 'ebook' | 'app' | 'template' | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Tampilan Awal - Pilih Kategori */}
        {selectedCategory === null && (
          <div className="space-y-10">
            
            {/* Header - IMPROVED VERSION */}
            <div className="text-center space-y-5">
              {/* Badge dengan stats */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Live Now
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  4.9/5 Rating
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-medium">
                  🎯 Promo Bundling
                </span>
              </div>

              {/* Title dengan gradient */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                  Pilih Kategori{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Produk Premium
                  </span>
                </h1>
                <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                  Dapatkan akses ke produk digital berkualitas tinggi dengan harga terjangkau.{" "}
                  <span className="text-emerald-400 font-medium">Instant delivery</span> & garansi 100%
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-6 text-sm pt-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-white">1000+</strong> Pengguna</span>
                </div>
                <div className="w-px h-4 bg-slate-700"></div>
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-white">Instant</strong> Access</span>
                </div>
                <div className="w-px h-4 bg-slate-700"></div>
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-white">100%</strong> Garansi</span>
                </div>
              </div>
            </div>

            {/* Category Grid - tetap sama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              
              {/* 1. Gmail */}
              <button
                onClick={() => setSelectedCategory('gmail')}
                className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-emerald-500 bg-slate-900/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-slate-500 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">Akun Gmail</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Akun Premium Fresh & Aman 100%
                </p>
                
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Terverifikasi
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Instant
                  </span>
                </div>
              </button>

              {/* 2. E-book */}
              <button
                onClick={() => setSelectedCategory('ebook')}
                className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-purple-500 bg-slate-900/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                    </svg>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-purple-500 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-slate-500 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">E-Book Premium</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Panduan Lengkap & To The Point
                </p>
                
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Kualitas HD
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Eksklusif
                  </span>
                </div>
              </button>

              {/* 3. WP Templates */}
              <button
                onClick={() => setSelectedCategory('template')}
                className="group text-left p-6 rounded-2xl border-2 border-slate-800 hover:border-blue-500 bg-slate-900/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9"/>
                    </svg>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-blue-500 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-slate-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">WP Templates</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Tema & Plugin Premium
                </p>
                
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Responsive
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Instant
                  </span>
                </div>
              </button>

              {/* 4. App Premium - Coming Soon */}
              <div className="relative text-left p-6 rounded-2xl border-2 border-slate-800 bg-slate-900/30 opacity-60">
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                    Segera
                  </span>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1 text-slate-400">App Premium</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Akses Premium ke Aplikasi Terbaik
                </p>
                
                <div className="flex gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Full Access
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Update
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Render komponen sesuai kategori yang dipilih */}
        {selectedCategory === 'gmail' && (
          <GmailProducts onBack={() => setSelectedCategory(null)} />
        )}

        {selectedCategory === 'ebook' && (
          <EbookProducts onBack={() => setSelectedCategory(null)} />
        )}
        
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