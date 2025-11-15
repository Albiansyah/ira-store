import "./globals.css";
import type { Metadata } from "next";
// Link tidak perlu lagi di sini, karena sudah di dalam Header component
import { Inter, Poppins } from "next/font/google";

// Impor provider dan header baru
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header"; // Asumsi path ke komponen Header baru

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "IRA STORE - Jual Akun Gmail & Digital Access",
  description: "Jual akun Gmail & digital access, kirim otomatis via WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id" // Ganti ke 'id' agar lebih konsisten
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased font-sans">
        {/* Bungkus semua dengan CartProvider.
          Ini "otak" yang menyediakan data keranjang ke semua halaman.
        */}
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            {/* Tampilkan komponen Header baru di sini.
              Header ini akan otomatis punya akses ke `useCart()`
              untuk menampilkan badge.
            */}
            <Header />

            {/* Header statis yang LAMA (yang ada di file Anda) sudah DIHAPUS 
              karena digantikan oleh <Header /> di atas.
            */}

            <div className="flex-1">{children}</div>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}