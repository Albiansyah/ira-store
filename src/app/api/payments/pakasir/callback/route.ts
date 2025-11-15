// src/app/api/payments/pakasir/callback/route.ts

import { NextResponse } from "next/server";
import { fulfillOrderAndSendWhatsApp } from "@/lib/orderFulfillment";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    console.log("Pakasir webhook body:", body);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Body JSON tidak valid" },
        { status: 400 }
      );
    }

    const {
      amount,
      order_id,
      project,
      status,
      payment_method,
      completed_at,
    } = body;

    if (!order_id || !project || !status) {
      return NextResponse.json(
        { ok: false, error: "Field wajib (order_id/project/status) kurang" },
        { status: 400 }
      );
    }

    const expectedProject = process.env.PAKASIR_PROJECT_SLUG;
    if (expectedProject && project !== expectedProject) {
      console.error("Project mismatch:", project, "vs", expectedProject);
      return NextResponse.json(
        { ok: false, error: "Project tidak cocok" },
        { status: 400 }
      );
    }

    // Kita hanya proses kalau status completed
    if (status !== "completed") {
      console.log("Webhook status bukan completed, diabaikan:", status);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const result = await fulfillOrderAndSendWhatsApp(order_id, {
      amount,
      payment_method,
    });

    if (!result.success) {
      console.error("Fulfill order gagal:", result.error);
      return NextResponse.json(
        { ok: false, error: result.error || "Gagal memproses order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Pakasir webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
