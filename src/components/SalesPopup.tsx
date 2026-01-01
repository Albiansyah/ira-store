"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, CheckCircle2 } from "lucide-react";

// 👇 DATABASE PALSU (Bisa ditambahin sesuka hati)
const names = [
  "Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hendra", 
  "Indra", "Joko", "Kevin", "Lina", "Maya", "Nanda", "Oscar", "Putri", 
  "Rizky", "Siti", "Tono", "Wulan", "Yudi", "Zainal"
];

const cities = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", 
  "Palembang", "Depok", "Tangerang", "Bekasi", "Bogor", "Malang", 
  "Solo", "Jogja", "Denpasar", "Batam"
];

const products = [
  "10 Akun Gmail Fresh",
  "50 Akun Gmail Ternak",
  "E-book Ternak Akun",
  "Template PPT Premium",
  "E-book Marketing",
  "Paket 5 Akun Gmail",
  "Template WordPress"
];

const timeAgo = ["1 menit lalu", "2 menit lalu", "Baru saja", "5 menit lalu"];

export default function SalesPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState({ name: "", city: "", product: "", time: "" });

  useEffect(() => {
    // Fungsi untuk mengacak data
    const showNotification = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const time = timeAgo[Math.floor(Math.random() * timeAgo.length)];

      setData({ name, city, product, time });
      setIsVisible(true);

      // Sembunyikan setelah 5 detik tampil
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Muncul pertama kali setelah 3 detik pengunjung datang
    const initialTimeout = setTimeout(showNotification, 3000);

    // Selanjutnya muncul setiap 15-25 detik (random biar natural)
    const interval = setInterval(() => {
      // Random delay tambahan biar gak kayak robot banget
      const randomDelay = Math.random() * 5000; 
      setTimeout(showNotification, randomDelay);
    }, 20000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0, transition: { duration: 0.5 } }}
          className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-50 flex items-center gap-4 p-4 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-900/20 max-w-[300px] md:max-w-sm"
        >
          {/* Icon */}
          <div className="shrink-0 w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span>Pesanan Baru</span>
              <span className="text-[10px] text-slate-500">{data.time}</span>
            </p>
            <p className="text-sm font-bold text-white truncate">
              {data.name} <span className="text-slate-500 font-normal">di</span> {data.city}
            </p>
            <p className="text-xs text-emerald-400 truncate mt-0.5">
              Membeli {data.product}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}