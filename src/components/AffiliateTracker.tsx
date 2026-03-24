"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Menangkap parameter '?ref=' dari URL
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      // Simpan ke localStorage agar bisa dibaca saat checkout
      localStorage.setItem("affiliate_ref", refCode);
      
      // Opsional: Catat waktu klik jika nanti mau ada fitur "Cookie Expiration" 
      // misal hangus setelah 30 hari.
      localStorage.setItem("affiliate_click_time", new Date().toISOString());
      
      console.log("[Affiliate] Referral code saved:", refCode);
    }
  }, [searchParams]);

  return null; // Komponen ini berjalan di background, tidak merender UI apa pun
}