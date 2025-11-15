// src/lib/orderFulfillment.ts

import { supabase } from "./supabaseClient";
import { sendWhatsAppMessage } from "./fonnte";

interface PaymentInfo {
  amount?: number;
  payment_method?: string;
}

export async function fulfillOrderAndSendWhatsApp(
  orderId: string,
  paymentInfo?: PaymentInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Ambil order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, buyer_email, buyer_phone, status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("Order not found:", orderErr);
      return { success: false, error: "Order tidak ditemukan" };
    }

    // Kalau sudah paid, jangan kirim dobel
    if (order.status === "paid" || order.status === "completed") {
      console.log("Order sudah diproses sebelumnya:", orderId);
      return { success: true };
    }

    // 2. Ambil items order untuk hitung total akun
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("id, effective_unit_count")
      .eq("order_id", orderId);

    if (itemsErr || !items || items.length === 0) {
      console.error("Order items error:", itemsErr);
      return {
        success: false,
        error: "Item order tidak ditemukan untuk order ini",
      };
    }

    const totalUnits = items.reduce(
      (sum, it: any) => sum + (it.effective_unit_count as number),
      0
    );

    if (totalUnits <= 0) {
      return {
        success: false,
        error: "Total akun di order ini tidak valid",
      };
    }

    // 3. Ambil stok akun yang belum terpakai
    const { data: stockRows, error: stockErr } = await supabase
      .from("accounts_stock")
      .select("id, email, password, is_used")
      .eq("is_used", false)
      .limit(totalUnits);

    if (stockErr) {
      console.error("Load stock error:", stockErr);
      return {
        success: false,
        error: "Gagal mengambil stok akun",
      };
    }

    const available = stockRows ?? [];
    if (available.length < totalUnits) {
      console.error(
        `Stok kurang. Dibutuhkan ${totalUnits}, tersedia ${available.length}`
      );
      return {
        success: false,
        error: "Stok akun kurang untuk memproses order ini",
      };
    }

    const selectedAccounts = available.slice(0, totalUnits);
    const selectedIds = selectedAccounts.map((a: any) => a.id);

    // 4. Tandai stok sebagai terpakai
    const { error: updateStockErr } = await supabase
      .from("accounts_stock")
      .update({ is_used: true })
      .in("id", selectedIds);

    if (updateStockErr) {
      console.error("Update stock error:", updateStockErr);
      return {
        success: false,
        error: "Gagal menandai stok akun sebagai terpakai",
      };
    }

    // 5. Build pesan WhatsApp
    const lines = selectedAccounts.map((acc: any, idx: number) => {
      return `${idx + 1}. ${acc.email} | ${acc.password}`;
    });

    const paymentText =
      paymentInfo?.payment_method || "Pakasir (otomatis terverifikasi)";

    const message = [
      `Halo, terima kasih sudah order akun Gmail di Gmail Store ✅`,
      ``,
      `Detail pesanan:`,
      `• Order ID: ${orderId}`,
      `• Total akun: ${totalUnits}`,
      `• Metode bayar: ${paymentText}`,
      paymentInfo?.amount
        ? `• Total bayar: Rp ${paymentInfo.amount.toLocaleString("id-ID")}`
        : "",
      ``,
      `Berikut detail akun yang Anda dapatkan:`,
      ...lines,
      ``,
      `Saran:`,
      `• Segera login dan ganti password.`,
      `• Jangan bagikan akun ini ke orang lain.`,
      ``,
      `Terima kasih 🙏`,
    ]
      .filter(Boolean)
      .join("\n");

    // 6. Kirim WhatsApp
    const target = String(order.buyer_phone || "").trim();
    if (!target) {
      console.error("Nomor WhatsApp kosong di order:", orderId);
      return { success: false, error: "Nomor WhatsApp di order kosong" };
    }

    const waResult = await sendWhatsAppMessage(target, message);

    if (!waResult.success) {
      console.error("Gagal kirim WA:", waResult.error, waResult.raw);
      return {
        success: false,
        error: "Gagal mengirim WhatsApp ke pembeli",
      };
    }

    // 7. Update status order jadi paid
    const updatePayload: any = { status: "paid" };
    if (paymentInfo?.payment_method) {
      updatePayload.payment_reference = paymentInfo.payment_method;
    }

    const { error: orderUpdateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (orderUpdateErr) {
      console.error("Gagal update status order:", orderUpdateErr);
      // tapi WA sudah terkirim, jadi kita anggap success aja
      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    console.error("fulfillOrderAndSendWhatsApp fatal error:", err);
    return {
      success: false,
      error: err?.message || "Error tidak diketahui saat memproses order",
    };
  }
}
