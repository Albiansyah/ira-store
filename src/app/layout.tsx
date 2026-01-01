import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import SalesPopup from "../components/SalesPopup";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header"; 
import Footer from "../components/Footer";

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
  title: "IRA STORE - Jual Akun Gmail Fresh, Amanah & Anti Hackback",
  description: "Pusat produk digital terpercaya. Jual akun Gmail fresh berkualitas, E-book, & Template. Transaksi otomatis kirim via WhatsApp dalam hitungan detik. 100% Amanah, Garansi No Hackback, dan CS Responsif.",
  keywords: [
    "jual akun gmail fresh",
    "akun gmail berkualitas",
    "produk digital amanah",
    "jual ebook premium",
    "template ppt",
    "ira store",
    "transaksi otomatis wa",
    "akun anti hackback"
  ],
  authors: [{ name: "Ira Store" }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "IRA STORE - Produk Digital Otomatis & Amanah",
    description: "Belanja produk digital tanpa ribet. Bayar langsung kirim ke WA. Garansi aman, no hackback, dan pelayanan CS super responsif.",
    url: "https://ira-store.web.id",
    siteName: "IRA STORE",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 Data Schema Markup untuk SEO Google (Toko Online)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "IRA STORE",
    "image": "https://ira-store.web.id/logo.png",
    "description": "Pusat belanja produk digital otomatis terpercaya. Menyediakan Akun Gmail Fresh, E-book, dan Template. Transaksi otomatis, 100% Amanah, Garansi No Hackback, dan Termurah di Indonesia.",
    "telephone": "+6285184657474", 
    "url": "https://ira-store.web.id",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Digital Store",
      "addressLocality": "Indonesia",
      "addressCountry": "ID"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "Mulai Rp 1.500" 
  };

  return (
    <html
      lang="id" 
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased font-sans">
        
        {/* 👇 Inject Script SEO Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />

            <div className="flex-1">{children}</div>

            <Footer />
          </div>
        </CartProvider>

        {/* 👇 Komponen Notifikasi Penjualan (Popup) */}
        <SalesPopup />

        {/* 👇 Komponen Pelacak Pengunjung */}
        <Analytics />
      </body>
    </html>
  );
}