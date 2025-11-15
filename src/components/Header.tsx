"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-wide font-poppins">
            IRA STORE
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline font-inter">
            E-Commerce Digital top #1
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-inter">
          <Link
            href="/products"
            className="text-slate-200 hover:text-emerald-400 transition-colors font-medium"
          >
            Produk
          </Link>
          
          {/* Link Keranjang dengan Badge */}
          <Link
            href="/checkout"
            className="relative px-4 py-2 rounded-lg text-slate-200 hover:text-emerald-400 hover:bg-slate-900/50 transition-all font-medium"
          >
            Keranjang
            
            {/* Badge Jumlah Item */}
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-slate-950">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/admin/login"
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-900/30 text-slate-300 hover:text-slate-200 transition-all font-medium"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}