// src/app/api/payments/check/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface CheckBody {
  orderId: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckBody;

    const orderId = String(body.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId wajib diisi" },
        { status: 400 }
      );
    }

    const project = process.env.PAKASIR_PROJECT_SLUG;
    const apiKey = process.env.PAKASIR_API_KEY;

    if (!project || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PAKASIR_PROJECT_SLUG atau PAKASIR_API_KEY belum dikonfigurasi di .env.local",
        },
        { status: 500 }
      );
    }

    // 1. Ambil total amount dari order_items (jumlah total_price)
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("total_price")
      .eq("order_id", orderId);

    if (itemsErr) {
      console.error("Supabase order_items error:", itemsErr);
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal mengambil data order_items: " +
            (itemsErr?.message || "unknown error"),
        },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada item untuk order ini.",
        },
        { status: 404 }
      );
    }

    const amount = items.reduce(
      (sum, it: any) => sum + Number(it.total_price || 0),
      0
    );

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nominal transaksi dari order_items tidak valid.",
        },
        { status: 500 }
      );
    }

    // 2. Panggil Pakasir transactiondetail
    const url = new URL("https://app.pakasir.com/api/transactiondetail");
    url.searchParams.set("project", project);
    url.searchParams.set("amount", String(Math.round(amount)));
    url.searchParams.set("order_id", orderId);
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { method: "GET" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("PakAsir transactiondetail error:", data);
      return NextResponse.json(
        {
          success: false,
          error: "PakAsir API error",
          data,
        },
        { status: 500 }
      );
    }

    // sesuai docs: { "transaction": { ... } }
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("payments/check fatal error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Server error",
      },
      { status: 500 }
    );
  }
}
