"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Package, Menu, X, Home } from "lucide-react";

export default function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Detect scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart badge bounce animation when items change
  useEffect(() => {
    if (totalItems > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-lg shadow-slate-900/50" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="text-base font-semibold tracking-wide font-poppins bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
            IRA STORE
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline font-inter group-hover:text-slate-300 transition-colors">
            E-Commerce Digital top #1
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-inter">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium group ${
              isActive("/")
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-200 hover:text-emerald-400 hover:bg-slate-900/50"
            }`}
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Home</span>
          </Link>

          <Link
            href="/products"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium group ${
              isActive("/products")
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-200 hover:text-emerald-400 hover:bg-slate-900/50"
            }`}
          >
            <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Produk</span>
          </Link>

          {/* Cart Link with Badge */}
          <Link
            href="/checkout"
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium group ${
              isActive("/checkout")
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-200 hover:text-emerald-400 hover:bg-slate-900/50"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-2 -right-2 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-950 shadow-lg ${
                    cartBounce ? "animate-bounce" : ""
                  }`}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <span>Keranjang</span>
          </Link>

          <Link
            href="/admin/login"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 transition-all font-medium group ${
              isActive("/admin/login")
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : "hover:border-slate-600 hover:bg-slate-900/30 text-slate-300 hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Masuk</span>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-900/50 transition-all"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2 font-inter">
            <Link
              href="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                isActive("/")
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/products"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                isActive("/products")
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Produk</span>
            </Link>

            <Link
              href="/checkout"
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all font-medium ${
                isActive("/checkout")
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span>Keranjang</span>
              </div>
              {totalItems > 0 && (
                <span className="min-w-6 h-6 px-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            <Link
              href="/admin/login"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-700 transition-all font-medium ${
                isActive("/admin/login")
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "text-slate-300 hover:bg-slate-900/30"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Masuk</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}