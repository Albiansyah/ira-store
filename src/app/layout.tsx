import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import { CartProvider } from "../context/CartContext";
import Header from "../components/Header"; 
import Footer from "../components/Footer"; // ← Tambah ini

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
  title: "IRA STORE - Digital E-Commerce Top #1",
  description: "Jual akun Gmail & digital access, kirim otomatis via WhatsApp",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id" 
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased font-sans">
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />

            <div className="flex-1">{children}</div>

            <Footer /> {/* ← Tambah ini */}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}