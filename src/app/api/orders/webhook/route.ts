// app/api/orders/webhook/route.ts

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient"; // <-- Import client SERVER

// --- Fungsi Helper Fonnte (Sama seperti sebelumnya) ---
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

  // 1. Log percobaan kirim WA
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
    // Lanjut aja, yang penting WA kekirim
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

    // 2. Update log setelah ada respon
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
    // 3. Update log jika Fonnte error
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({ status: "failed", response_raw: { error: err.message } })
        .eq("id", logId);
    }
    return false;
  }
}

// --- FUNGSI UTAMA WEBHOOK ---
export async function POST(request: Request) {
  let orderId: string | null = null; // Definisikan di scope luar untuk error handling

  try {
    const dataDariPakasir = await request.json();
    console.log("--- WEBHOOK DITERIMA DARI PAKASIR ---");
    console.log(JSON.stringify(dataDariPakasir, null, 2));

    // 1. 🔑 VALIDASI WEBHOOK
    const apiKeyHeader = request.headers.get("X-Api-Key"); // (Cek header-nya Pakasir)
    const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

    if (!PAKASIR_API_KEY || apiKeyHeader !== PAKASIR_API_KEY) {
      console.warn("Webhook: Validasi API Key Gagal");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AMBIL DATA PENTING
    // (PENTING: Sesuaikan nama field ini dengan JSON asli dari Pakasir)
    orderId = dataDariPakasir.order_id;
    const statusPembayaran = dataDariPakasir.status;

    if (!orderId || !statusPembayaran) {
      console.error("Webhook: Data dari Pakasir tidak lengkap");
      return NextResponse.json({ success: true, message: "Data incomplete" });
    }

    // 3. PROSES HANYA JIKA LUNAS
    if (statusPembayaran === "PAID" || statusPembayaran === "SUCCESS") {
      console.log(`Order ${orderId} telah dibayar. Memproses...`);

      // 4. CEK & UPDATE ORDER DI SUPABASE
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("status, buyer_phone")
        .eq("id", orderId)
        .single();

      if (orderError) throw new Error(`Order ${orderId} tidak ditemukan di DB.`);
      if (order.status !== "pending") {
        console.log(`Order ${orderId} sudah diproses (status: ${order.status}). Mengabaikan.`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // Update status jadi 'paid' (artinya sedang diproses)
      await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

      // 5. AMBIL DETAIL ITEM & HITUNG KEBUTUHAN STOK
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id, effective_unit_count")
        .eq("order_id", orderId);

      if (itemsError || !items) throw new Error(`Gagal ambil item untuk order ${orderId}`);
      
      const totalUnitsNeeded = items.reduce(
        (sum, item) => sum + item.effective_unit_count,
        0
      );
      if (totalUnitsNeeded === 0) throw new Error("Kebutuhan unit 0, aneh.");

      // 6. ALOKASI STOK
      const { data: stokAkun, error: stokError } = await supabase
        .from("accounts_stock")
        .select("id, username, password") // Ganti 'username' jadi 'email' jika nama kolom beda
        .eq("is_used", false)
        .limit(totalUnitsNeeded);

      if (stokError) throw new Error(`Gagal ambil stok: ${stokError.message}`);

      // 7. CEK KECUKUPAN STOK
      if (!stokAkun || stokAkun.length < totalUnitsNeeded) {
        // GAWAT! Stok habis.
        console.error(`STOK HABIS untuk order ${orderId}. Butuh ${totalUnitsNeeded}, sisa ${stokAkun?.length || 0}`);
        await sendWhatsapp(
          order.buyer_phone,
          `Halo, pembayaran order ${orderId} BERHASIL, tapi stok kami sedang habis. Mohon segera hubungi admin untuk refund atau info lebih lanjut.`,
          orderId
        );
        // Tandai order gagal/butuh intervensi
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        return NextResponse.json({ success: true, message: "Out of stock" });
      }

      // 8. FORMAT PESAN & KIRIM WA
      const listAkun = stokAkun
        .map((akun) => `${akun.username}:${akun.password}`) // Ganti 'username'
        .join("\n");
      
      const pesanWA = `Pesanan ${orderId} LUNAS!\n\nTerima kasih, ini detail akun Anda:\n${listAkun}\n\nHarap segera ganti password.`;
      
      const waSuccess = await sendWhatsapp(order.buyer_phone, pesanWA, orderId);
      if (!waSuccess) throw new Error("Gagal kirim WA Fonnte");

      // 9. UPDATE STOK & LINK KE ORDER_ITEMS
      // Ini bagian paling penting untuk mencegah double-selling
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

        if (updateStokError) throw new Error(`Gagal update stok: ${updateStokError.message}`);
        stockIndex += item.effective_unit_count;
      }

      // 10. SELESAI! Tandai order sebagai 'completed'
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      console.log(`SUKSES: Order ${orderId} selesai diproses dan WA terkirim.`);

    } else {
      console.log(`Order ${orderId} status: ${statusPembayaran} (diabaikan)`);
    }

    // 11. Selalu balas "OK" ke Pakasir
    return NextResponse.json({ success: true, message: "Webhook received" });

  } catch (err: any) {
    console.error(`Webhook Gagal Diproses (Order: ${orderId || '??'}):`, err.message);
    
    // Jika order ID-nya ada, tandai sebagai 'cancelled' atau 'failed'
    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "cancelled" }) // 'cancelled' atau 'failed'
        .eq("id", orderId);
    }
    
    // Kirim balasan error ke Pakasir (Pakasir mungkin akan coba lagi nanti)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}