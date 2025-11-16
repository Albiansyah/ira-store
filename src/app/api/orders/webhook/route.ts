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
  } else if (formattedTarget.startsWith("+")) {
    formattedTarget = formattedTarget.substring(1);
  } else if (!formattedTarget.startsWith("62")) {
    formattedTarget = "62" + formattedTarget;
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
        .select("status, buyer_phone, buyer_email")
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

      // 5. AMBIL ORDER ITEMS DENGAN PRODUCT INFO
      console.log(`[Webhook] 🔍 Step 3: Fetching order items with product details...`);
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id, 
          effective_unit_count,
          quantity,
          products!inner(id, name, product_type, file_url)
        `)
        .eq("order_id", orderId);

      if (itemsError || !items) {
        console.error(`[Webhook] ❌ Failed to fetch items:`, itemsError?.message);
        throw new Error(`Gagal ambil items: ${itemsError?.message}`);
      }

      console.log(`[Webhook] ✅ Found ${items.length} items`);

      // 🔥 DEBUG LOG - DETAIL SETIAP ITEM
      console.log(`[Webhook] 🔍 ========== DEBUG ITEMS START ==========`);
      console.log(`[Webhook] 📦 Total items received: ${items.length}`);
      items.forEach((item: any, index: number) => {
        console.log(`[Webhook] 📋 Item #${index + 1}:`, {
          product_id: item.products.id,
          name: item.products.name,
          product_type: item.products.product_type,
          quantity: item.quantity,
          effective_unit_count: item.effective_unit_count,
          has_file_url: !!item.products.file_url,
          file_url: item.products.file_url || 'NULL'
        });
      });

      // 6. PISAHKAN BERDASARKAN PRODUCT TYPE
      const gmailItems = items.filter((item: any) => item.products.product_type === "gmail");
      const ebookItems = items.filter((item: any) => item.products.product_type === "ebook");
      
      console.log(`[Webhook] 📊 Filtered Results:`);
      console.log(`[Webhook]    - Gmail items: ${gmailItems.length}`);
      console.log(`[Webhook]    - Ebook items: ${ebookItems.length}`);
      
      if (gmailItems.length > 0) {
        console.log(`[Webhook] 🔐 Gmail products:`, gmailItems.map((i: any) => i.products.name));
      }
      if (ebookItems.length > 0) {
        console.log(`[Webhook] 📚 Ebook products:`, ebookItems.map((i: any) => i.products.name));
      }
      console.log(`[Webhook] 🔍 ========== DEBUG ITEMS END ==========`);

      let pesanWA = `*✅ KONFIRMASI PEMBAYARAN*\n`;
      pesanWA += `Pembayaran Anda telah berhasil diverifikasi.\n`;
      pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n`;
      pesanWA += `📋 *INFORMASI PESANAN*\n`;
      pesanWA += `  Order ID: ${orderId}\n`;
      pesanWA += `  Email: ${order.buyer_email}\n`;
      pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // 7. PROSES GMAIL ITEMS (jika ada)
      if (gmailItems.length > 0) {
        const totalGmailUnits = gmailItems.reduce(
          (sum, item: any) => sum + item.effective_unit_count,
          0
        );
        
        console.log(`[Webhook] 📊 Total Gmail units needed: ${totalGmailUnits}`);

        // AMBIL STOK GMAIL
        console.log(`[Webhook] 🔍 Step 4: Fetching Gmail stock...`);
        const { data: stokAkun, error: stokError } = await supabase
          .from("accounts_stock")
          .select("id, username, password")
          .eq("is_used", false)
          .limit(totalGmailUnits);

        if (stokError) {
          console.error(`[Webhook] ❌ Failed to fetch stock:`, stokError.message);
          throw new Error(`Gagal ambil stok: ${stokError.message}`);
        }

        console.log(`[Webhook] ✅ Found ${stokAkun?.length || 0} available Gmail accounts`);

        // CEK KECUKUPAN STOK
        if (!stokAkun || stokAkun.length < totalGmailUnits) {
          console.error(
            `[Webhook] ❌ INSUFFICIENT STOCK! Needed: ${totalGmailUnits}, Available: ${stokAkun?.length || 0}`
          );
          
          await sendWhatsapp(
            order.buyer_phone,
            `Halo, pembayaran order ${orderId} BERHASIL, tapi stok Gmail kami sedang habis. Mohon hubungi admin untuk refund atau penggantian.`,
            orderId
          );
          
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
          return NextResponse.json({ success: true, message: "Gmail out of stock" });
        }

        // FORMAT PESAN AKUN GMAIL
        const listAkun = stokAkun
          .map((akun) => `Email: ${akun.username}\nPassword: ${akun.password}`)
          .join("\n\n");
        
        pesanWA += `🔐 *AKUN GMAIL* (${totalGmailUnits} akun)\n\n`;
        pesanWA += `${listAkun}\n`;
        pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n`;
        pesanWA += `⚠️ *PENTING - Keamanan Akun*\n\n`;
        pesanWA += `  Demi keamanan, harap segera:\n`;
        pesanWA += `  1. Login ke akun Anda\n`;
        pesanWA += `  2. Ganti password default\n`;
        pesanWA += `  3. Simpan kredensial dengan aman\n`;
        pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // UPDATE STOK GMAIL
        console.log(`[Webhook] 🔄 Step 5: Updating Gmail stock records...`);
        let stockIndex = 0;
        for (const item of gmailItems) {
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

        console.log(`[Webhook] ✅ Gmail stock updated successfully`);
      }

      // 8. PROSES E-BOOK ITEMS (jika ada)
      if (ebookItems.length > 0) {
        console.log(`[Webhook] 📚 Step 6: Processing E-book items...`);
        
        pesanWA += `📚 *E-BOOK PREMIUM*\n\n`;
        
        for (const item of ebookItems) {
          const product = item.products;
          const quantity = item.quantity;
          
          pesanWA += `📖 *${product.name}*`;
          if (quantity > 1) {
            pesanWA += ` (${quantity}x)\n`;
          } else {
            pesanWA += `\n`;
          }
          
          if (product.file_url) {
            pesanWA += `🔗 Download: ${product.file_url}\n`;
            console.log(`[Webhook] ✅ E-book "${product.name}" has file_url`);
          } else {
            pesanWA += `⚠️ Link download akan dikirim segera via email\n`;
            console.warn(`[Webhook] ⚠️ E-book "${product.name}" MISSING file_url!`);
          }
          pesanWA += `\n`;
        }
        
        pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n`;
        pesanWA += `💡 *Info E-book*\n\n`;
        pesanWA += `  ✓ Format PDF Berkualitas HD\n`;
        pesanWA += `  ✓ Akses Selamanya\n`;
        pesanWA += `  ✓ Bisa Download Kapan Saja\n`;
        pesanWA += `  ✓ Update Gratis (Jika Ada)\n`;
        pesanWA += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        console.log(`[Webhook] ✅ E-book items processed`);
      }

      // 9. CLOSING MESSAGE
      pesanWA += `_Jika ada pertanyaan, jangan ragu untuk menghubungi kami._\n`;
      pesanWA += `Terima kasih atas kepercayaan Anda. 🙏\n\n`;
      pesanWA += `_Pesan otomatis - Mohon tidak membalas_`;
      
      // 🔥 DEBUG - LOG PESAN WA SEBELUM DIKIRIM
      console.log(`[Webhook] 📱 ========== WhatsApp Message Preview ==========`);
      console.log(pesanWA);
      console.log(`[Webhook] 📱 ====================================================`);
      
      // 10. KIRIM WA
      console.log(`[Webhook] 📱 Step 7: Sending WhatsApp to ${order.buyer_phone}...`);
      const waSuccess = await sendWhatsapp(order.buyer_phone, pesanWA, orderId);
      
      if (!waSuccess) {
        console.warn("[Webhook] ⚠️ WhatsApp failed to send, but continuing...");
      }

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