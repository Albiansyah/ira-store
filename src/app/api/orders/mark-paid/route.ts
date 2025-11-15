// src/app/api/orders/mark-paid/route.ts
import { NextResponse } from "next/server";
import { fulfillOrderAndSendWhatsApp } from "@/lib/orderFulfillment";

interface MarkPaidBody {
  orderId: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MarkPaidBody;
    const orderId = String(body.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId wajib diisi" },
        { status: 400 }
      );
    }

    const result = await fulfillOrderAndSendWhatsApp(orderId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Gagal memproses order & mengirim WA",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, orderId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("orders/mark-paid fatal error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Server error",
      },
      { status: 500 }
    );
  }
}
