// src/app/api/affiliates/auth/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, name, whatsapp } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email wajib diisi" }, { status: 400 });
    }

    // --- LOGIC LOGIN ---
    if (action === "login") {
      const affiliate = await db.affiliate.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!affiliate) {
        return NextResponse.json({ success: false, error: "Email tidak ditemukan. Silakan daftar terlebih dahulu." }, { status: 404 });
      }

      if (affiliate.status !== "active") {
        return NextResponse.json({ success: false, error: "Akun Anda sedang dinonaktifkan." }, { status: 403 });
      }

      return NextResponse.json({ success: true, affiliate });
    }

    // --- LOGIC REGISTER ---
    if (action === "register") {
      if (!name || !whatsapp) {
        return NextResponse.json({ success: false, error: "Nama dan WhatsApp wajib diisi untuk mendaftar" }, { status: 400 });
      }

      const existing = await db.affiliate.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        return NextResponse.json({ success: false, error: "Email sudah terdaftar. Silakan login." }, { status: 400 });
      }

      // Generate Kode Referral Unik (4 Huruf Depan Nama + 4 Angka Random)
      const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(4, 'X');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const referralCode = `${prefix}${randomNum}`;

      const newAffiliate = await db.affiliate.create({
        data: {
          name,
          email: email.toLowerCase(),
          whatsapp,
          referralCode,
          balance: 0,
          status: "active",
        },
      });

      return NextResponse.json({ success: true, affiliate: newAffiliate });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak valid" }, { status: 400 });

  } catch (err: any) {
    console.error("[Affiliate Auth API]", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}