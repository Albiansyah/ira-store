// app/api/orders/webhook/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient"; // Pastikan ini client SERVER

// --- FUNGSI UTAMA WEBHOOK ---
export async function POST(request: Request) {
  // --- ⬇️ KODE MATA-MATA (UNTUK DEBUG) ⬇️ ---
  // 1. Ubah headers jadi objek biasa
  const headersObject = Object.fromEntries(request.headers.entries());

  // 2. Log SEMUA headers ke Vercel
  console.log("--- 🕵️‍♂️ SEMUA HEADERS YANG MASUK DARI PAKASIR ---");
  console.log(JSON.stringify(headersObject, null, 2));
  // --- ⬆️ BATAS KODE MATA-MATA ⬆️ ---

  let orderId: string | null = null; // Definisikan di scope luar untuk error handling

  try {
    const dataDariPakasir = await request.json();
    console.log("--- WEBHOOK DITERIMA DARI PAKASIR ---");
    console.log(JSON.stringify(dataDariPakasir, null, 2));

    // 1. 🔑 VALIDASI WEBHOOK (YANG MASIH ERROR 401)
    const apiKeyHeader = request.headers.get("X-Api-Key"); // (Kita masih nebak 'X-Api-Key')
    const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

    // --- Tambahan log untuk debug ---
    console.log("KUNCI DARI HEADER PAKASIR (X-Api-Key):", apiKeyHeader);
    console.log("KUNCI DARI VERCEL (.env):", PAKASIR_API_KEY);
    // --- Batas tambahan log ---

    if (!PAKASIR_API_KEY || apiKeyHeader !== PAKASIR_API_KEY) {
      console.warn(
        "Webhook: Validasi API Key Gagal. KEDUA KUNCI DI ATAS TIDAK SAMA."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AMBIL DATA PENTING
    orderId = dataDariPakasir.order_id;
    const statusPembayaran = dataDariPakasir.status;

    if (!orderId || !statusPembayaran) {
      console.error("Webhook: Data dari Pakasir tidak lengkap");
      return NextResponse.json({ success: true, message: "Data incomplete" });
    }

    // 3. PROSES HANYA JIKA LUNAS
    if (
      statusPembayaran === "PAID" ||
      statusPembayaran === "SUCCESS" ||
      statusPembayaran === "completed" // Tambahkan 'completed' dari log lo
    ) {
      console.log(`Order ${orderId} telah dibayar. Memproses...`);

      // 4. CEK & UPDATE ORDER DI SUPABASE
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("status, buyer_phone") // Pastikan tabel orders ada 'buyer_phone'
        .eq("id", orderId)
        .single();

      if (orderError)
        throw new Error(`Order ${orderId} tidak ditemukan di DB.`);
      if (order.status !== "pending") {
        console.log(
          `Order ${orderId} sudah diproses (status: ${order.status}). Mengabaikan.`
        );
        return NextResponse.json({
          success: true,
          message: "Already processed",
        });
      }

      // Update status jadi 'paid' (artinya sedang diproses)
      await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

      // 5. AMBIL DETAIL ITEM & HITUNG KEBUTUHAN STOK
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id, effective_unit_count") // Pastikan tabel order_items ada 'effective_unit_count'
        .eq("order_id", orderId);

      if (itemsError || !items)
        throw new Error(`Gagal ambil item untuk order ${orderId}`);

      const totalUnitsNeeded = items.reduce(
        (sum, item) => sum + item.effective_unit_count,
        0
      );
      if (totalUnitsNeeded === 0)
        throw new Error("Kebutuhan unit 0, aneh.");

      // 6. ALOKASI STOK
      const { data: stokAkun, error: stokError } = await supabase
        .from("accounts_stock")
        .select("id, username, password") // Pastikan nama kolom 'username'
        .eq("is_used", false)
        .limit(totalUnitsNeeded);

      if (stokError)
        throw new Error(`Gagal ambil stok: ${stokError.message}`);

      // 7. CEK KECUKUPAN STOK
      if (!stokAkun || stokAkun.length < totalUnitsNeeded) {
        console.error(
          `STOK HABIS untuk order ${orderId}. Butuh ${totalUnitsNeeded}, sisa ${
            stokAkun?.length || 0
          }`
        );
        await sendWhatsapp(
          order.buyer_phone,
          `Halo, pembayaran order ${orderId} BERHASIL, tapi stok kami sedang habis. Mohon segera hubungi admin untuk refund atau info lebih lanjut.`,
          orderId
        );
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId);
        return NextResponse.json({ success: true, message: "Out of stock" });
      }

      // 8. FORMAT PESAN & KIRIM WA
      const listAkun = stokAkun
        .map((akun) => `${akun.username}:${akun.password}`) // Pastikan 'username'
        .join("\n");

      const pesanWA = `Pesanan ${orderId} LUNAS!\n\nTerima kasih, ini detail akun Anda:\n${listAkun}\n\nHarap segera ganti password.`;

      const waSuccess = await sendWhatsapp(
        order.buyer_phone,
        pesanWA,
        orderId
      );
      if (!waSuccess) throw new Error("Gagal kirim WA Fonnte");

      // 9. UPDATE STOK & LINK KE ORDER_ITEMS
      let stockIndex = 0;
      for (const item of items) {
        const accountsForItem = stokAkun.slice(
          stockIndex,
          stockIndex + item.effective_unit_count
        );
        const accountIds = accountsForItem.map((a) => a.id);

        const { error: updateStokError } = await supabase
          .from("accounts_stock")
          .update({
            is_used: true,
            assigned_order_item_id: item.id,
          })
          .in("id", accountIds);

        if (updateStokError)
          throw new Error(`Gagal update stok: ${updateStokError.message}`);
        stockIndex += item.effective_unit_count;
      }

      // 10. SELESAI! Tandai order sebagai 'completed'
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      console.log(
        `SUKSES: Order ${orderId} selesai diproses dan WA terkirim.`
      );
    } else {
      console.log(`Order ${orderId} status: ${statusPembayaran} (diabaikan)`);
    }

    // 11. Selalu balas "OK" ke Pakasir
    return NextResponse.json({ success: true, message: "Webhook received" });
  } catch (err: any) {
    console.error(
      `Webhook Gagal Diproses (Order: ${orderId || "??"}):`,
      err.message
    );

    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- Fungsi Helper Fonnte ---
async function sendWhatsapp(
  target: string,
  message: string,
  orderId: string
) {
  const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
  if (!FONNTE_API_KEY) throw new Error("FONNTE_API_KEY not found");

  let formattedTarget = target.trim();
  if (formattedTarget.startsWith("0")) {
    formattedTarget = "62" + formattedTarget.substring(1);
  }

  const url = "https://api.fonnte.com/send";
  const body = JSON.stringify({
    target: formattedTarget,
    message: message,
    countryCode: "62",
  });

  const { data: logData, error: logInsertError } = await supabase
    .from("whatsapp_logs")
    .insert({
      order_id: orderId,
      to_number: formattedTarget,
      message: message,
      status: "sending",
    })
    .select("id")
    .single();

  if (logInsertError) {
    console.error("Gagal log WA:", logInsertError.message);
  }

  const logId = logData?.id;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: FONNTE_API_KEY,
      },
      body: body,
    });

    const data = await response.json();

    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({
          status: response.ok ? "sent" : "failed",
          response_raw: data,
        })
        .eq("id", logId);
    }

    if (!response.ok) {
      throw new Error(`Fonnte API error: ${JSON.stringify(data)}`);
    }

    console.log("Fonnte terkirim:", data);
    return true;
  } catch (err: any) {
    console.error("Error di fungsi sendWhatsapp:", err.message);
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({ status: "failed", response_raw: { error: err.message } })
        .eq("id", logId);
    }
    return false;
  }
}