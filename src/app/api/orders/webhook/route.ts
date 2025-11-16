// src/app/api/orders/webhook/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServerClient";

// --- Fungsi Helper Fonnte ---
async function sendWhatsapp(
  target: string,
  message: string,
  orderId: string
) {
  console.log(`[Webhook] 📱 Attempting to send WhatsApp to ${target}`);
  const supabase = getSupabaseAdmin();
  const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
  
  if (!FONNTE_API_KEY) {
    console.error("[Webhook] ❌ FONNTE_API_KEY not found");
    throw new Error("FONNTE_API_KEY not found");
  }

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
    console.error("[Webhook] ⚠️ Failed to log WA attempt:", logInsertError.message);
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

    console.log("[Webhook] ✅ WhatsApp sent successfully:", data);
    return true;
  } catch (err: any) {
    console.error("[Webhook] ❌ Error sending WhatsApp:", err.message);
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
  let orderId: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const dataDariPakasir = await request.json();
    
    console.log("[Webhook] 📥 --- WEBHOOK DITERIMA DARI PAKASIR ---");
    console.log(JSON.stringify(dataDariPakasir, null, 2));

    // 1. AMBIL DATA PENTING
    orderId = dataDariPakasir.order_id;
    const statusPembayaran = dataDariPakasir.status;

    if (!orderId || !statusPembayaran) {
      console.error("[Webhook] ❌ Data tidak lengkap");
      return NextResponse.json({ success: true, message: "Data incomplete" });
    }

    console.log(`[Webhook] 📦 Order ID: ${orderId}, Status: ${statusPembayaran}`);

    // 2. PROSES HANYA JIKA LUNAS
    if (
      statusPembayaran === "completed" || 
      statusPembayaran === "PAID" || 
      statusPembayaran === "SUCCESS"
    ) {
      console.log(`[Webhook] ✅ Payment completed. Processing order ${orderId}...`);

      // 3. CEK ORDER DI SUPABASE
      console.log(`[Webhook] 🔍 Step 1: Fetching order from database...`);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("status, buyer_phone")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error(`[Webhook] ❌ Order not found:`, orderError.message);
        throw new Error(`Order ${orderId} tidak ditemukan: ${orderError.message}`);
      }

      console.log(`[Webhook] ✅ Order found. Current status: ${order.status}`);
      
      if (order.status !== "pending") {
        console.log(`[Webhook] ⚠️ Order already processed (status: ${order.status})`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // 4. UPDATE STATUS KE 'PAID'
      console.log(`[Webhook] 🔄 Step 2: Updating order status to 'paid'...`);
      const { error: updatePaidError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      if (updatePaidError) {
        console.error(`[Webhook] ❌ Failed to update status:`, updatePaidError.message);
        throw new Error(`Failed to update order status: ${updatePaidError.message}`);
      }
      console.log(`[Webhook] ✅ Order status updated to 'paid'`);

      // 5. AMBIL ORDER ITEMS
      console.log(`[Webhook] 🔍 Step 3: Fetching order items...`);
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id, effective_unit_count")
        .eq("order_id", orderId);

      if (itemsError || !items) {
        console.error(`[Webhook] ❌ Failed to fetch items:`, itemsError?.message);
        throw new Error(`Gagal ambil items: ${itemsError?.message}`);
      }

      console.log(`[Webhook] ✅ Found ${items.length} items`);
      
      const totalUnitsNeeded = items.reduce(
        (sum, item) => sum + item.effective_unit_count,
        0
      );
      
      console.log(`[Webhook] 📊 Total units needed: ${totalUnitsNeeded}`);

      if (totalUnitsNeeded === 0) {
        throw new Error("Total units needed is 0");
      }

      // 6. AMBIL STOK
      console.log(`[Webhook] 🔍 Step 4: Fetching available stock...`);
      const { data: stokAkun, error: stokError } = await supabase
        .from("accounts_stock")
        .select("id, username, password")
        .eq("is_used", false)
        .limit(totalUnitsNeeded);

      if (stokError) {
        console.error(`[Webhook] ❌ Failed to fetch stock:`, stokError.message);
        throw new Error(`Gagal ambil stok: ${stokError.message}`);
      }

      console.log(`[Webhook] ✅ Found ${stokAkun?.length || 0} available accounts`);

      // 7. CEK KECUKUPAN STOK
      if (!stokAkun || stokAkun.length < totalUnitsNeeded) {
        console.error(
          `[Webhook] ❌ INSUFFICIENT STOCK! Needed: ${totalUnitsNeeded}, Available: ${stokAkun?.length || 0}`
        );
        
        await sendWhatsapp(
          order.buyer_phone,
          `Halo, pembayaran order ${orderId} BERHASIL, tapi stok kami sedang habis. Mohon hubungi admin untuk refund.`,
          orderId
        );
        
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        return NextResponse.json({ success: true, message: "Out of stock" });
      }

      // 8. FORMAT PESAN WA
      console.log(`[Webhook] 📝 Step 5: Preparing WhatsApp message...`);
      const listAkun = stokAkun
        .map((akun) => `Email: ${akun.username}\nPassword: ${akun.password}`)
        .join("\n\n");
      
      const pesanWA = `🎉 Pembayaran Berhasil!\n\nOrder ID: ${orderId}\n\nBerikut detail akun Anda:\n\n${listAkun}\n\n⚠️ Harap segera ganti password untuk keamanan.\n\nTerima kasih telah berbelanja! 🙏`;
      
      // 9. KIRIM WA
      console.log(`[Webhook] 📱 Step 6: Sending WhatsApp...`);
      const waSuccess = await sendWhatsapp(order.buyer_phone, pesanWA, orderId);
      
      if (!waSuccess) {
        console.warn("[Webhook] ⚠️ WhatsApp failed to send, but continuing...");
      }

      // 10. UPDATE STOK
      console.log(`[Webhook] 🔄 Step 7: Updating stock records...`);
      let stockIndex = 0;
      for (const item of items) {
        const accountsForItem = stokAkun.slice(
          stockIndex,
          stockIndex + item.effective_unit_count
        );
        const accountIds = accountsForItem.map((a) => a.id);

        console.log(`[Webhook] 🔄 Marking ${accountIds.length} accounts as used for item ${item.id}`);

        const { error: updateStokError } = await supabase
          .from("accounts_stock")
          .update({
            is_used: true,
            assigned_order_item_id: item.id,
          })
          .in("id", accountIds);

        if (updateStokError) {
          console.error(`[Webhook] ❌ Failed to update stock:`, updateStokError.message);
          throw new Error(`Gagal update stok: ${updateStokError.message}`);
        }
        
        stockIndex += item.effective_unit_count;
      }

      console.log(`[Webhook] ✅ Stock updated successfully`);

      // 11. TANDAI COMPLETED
      console.log(`[Webhook] 🔄 Step 8: Marking order as completed...`);
      const { error: completeError } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (completeError) {
        console.error(`[Webhook] ❌ Failed to mark as completed:`, completeError.message);
        throw new Error(`Failed to complete order: ${completeError.message}`);
      }

      console.log(`[Webhook] 🎉 ===== ORDER ${orderId} COMPLETED SUCCESSFULLY =====`);

    } else {
      console.log(`[Webhook] ℹ️ Status '${statusPembayaran}' ignored (not completed)`);
    }

    return NextResponse.json({ success: true, message: "Webhook received" });

  } catch (err: any) {
    console.error(`[Webhook] 💥 FATAL ERROR (Order: ${orderId || '??'}):`, err.message);
    console.error(`[Webhook] Stack trace:`, err.stack);
    
    if (orderId) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId);
        console.log(`[Webhook] Order ${orderId} marked as cancelled due to error`);
      } catch (rollbackErr: any) {
        console.error(`[Webhook] Failed to rollback order:`, rollbackErr.message);
      }
    }
    
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}