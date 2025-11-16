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
    console.log(`[Fulfillment] Processing order ${orderId}...`);

    // 1. Ambil order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, buyer_email, buyer_phone, status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("[Fulfillment] Order not found:", orderErr);
      return { success: false, error: "Order tidak ditemukan" };
    }

    console.log(`[Fulfillment] Order found. Current status: ${order.status}`);

    // Kalau sudah paid/completed, jangan kirim dobel
    if (order.status === "paid" || order.status === "completed") {
      console.log("[Fulfillment] Order sudah diproses sebelumnya:", orderId);
      return { success: true };
    }

    // 2. Ambil items order DENGAN product info untuk cek type
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select(`
        id, 
        effective_unit_count,
        quantity,
        product_id,
        products!inner(id, name, product_type, file_url)
      `)
      .eq("order_id", orderId);

    if (itemsErr || !items || items.length === 0) {
      console.error("[Fulfillment] Order items error:", itemsErr);
      return {
        success: false,
        error: "Item order tidak ditemukan untuk order ini",
      };
    }

    console.log(`[Fulfillment] Found ${items.length} items in order`);

    // 3. Pisahkan berdasarkan product type
    const gmailItems = items.filter((item: any) => item.products.product_type === "gmail");
    const ebookItems = items.filter((item: any) => item.products.product_type === "ebook");

    console.log(`[Fulfillment] Gmail items: ${gmailItems.length}, E-book items: ${ebookItems.length}`);

    let message = `*✅ KONFIRMASI PEMBAYARAN*\n`;
    message += `Pembayaran Anda telah berhasil diverifikasi.\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *INFORMASI PESANAN*\n`;
    message += `  Order ID: ${orderId}\n`;
    message += `  Email: ${order.buyer_email}\n`;
    if (paymentInfo?.payment_method) {
      message += `  Metode: ${paymentInfo.payment_method}\n`;
    }
    if (paymentInfo?.amount) {
      message += `  Total: Rp ${paymentInfo.amount.toLocaleString("id-ID")}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // 4. PROSES GMAIL ITEMS (jika ada)
    if (gmailItems.length > 0) {
      const totalGmailUnits = gmailItems.reduce(
        (sum, it: any) => sum + (it.effective_unit_count as number),
        0
      );

      console.log(`[Fulfillment] Fetching ${totalGmailUnits} Gmail accounts...`);

      // Ambil stok akun Gmail
      const { data: stockRows, error: stockErr } = await supabase
        .from("accounts_stock")
        .select("id, username, password, is_used")
        .eq("is_used", false)
        .limit(totalGmailUnits);

      if (stockErr) {
        console.error("[Fulfillment] Load stock error:", stockErr);
        return {
          success: false,
          error: "Gagal mengambil stok akun Gmail",
        };
      }

      const available = stockRows ?? [];
      console.log(`[Fulfillment] Available Gmail stock: ${available.length}`);

      if (available.length < totalGmailUnits) {
        console.error(
          `[Fulfillment] Stok Gmail kurang. Dibutuhkan ${totalGmailUnits}, tersedia ${available.length}`
        );
        return {
          success: false,
          error: "Stok akun Gmail kurang untuk memproses order ini",
        };
      }

      const selectedAccounts = available.slice(0, totalGmailUnits);

      // Tandai stok sebagai terpakai dengan assigned_order_item_id
      console.log(`[Fulfillment] Marking Gmail accounts as used...`);
      let stockIndex = 0;
      for (const item of gmailItems) {
        const accountsForItem = selectedAccounts.slice(
          stockIndex,
          stockIndex + item.effective_unit_count
        );
        const accountIds = accountsForItem.map((a: any) => a.id);

        console.log(`[Fulfillment] Assigning ${accountIds.length} accounts to item ${item.id}`);

        const { error: updateStockErr } = await supabase
          .from("accounts_stock")
          .update({ 
            is_used: true,
            assigned_order_item_id: item.id 
          })
          .in("id", accountIds);

        if (updateStockErr) {
          console.error("[Fulfillment] Update stock error:", updateStockErr);
          return {
            success: false,
            error: "Gagal menandai stok akun sebagai terpakai",
          };
        }

        stockIndex += item.effective_unit_count;
      }

      console.log(`[Fulfillment] Gmail stock updated successfully`);

      // Build pesan akun Gmail
      message += `🔐 *AKUN GMAIL* (${totalGmailUnits} akun)\n\n`;
      const lines = selectedAccounts.map((acc: any) => {
        return `Email: ${acc.username}\nPassword: ${acc.password}`;
      });
      message += lines.join("\n\n");
      message += `\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `⚠️ *PENTING - Keamanan Akun*\n\n`;
      message += `  Demi keamanan, harap segera:\n`;
      message += `  1. Login ke akun Anda\n`;
      message += `  2. Ganti password default\n`;
      message += `  3. Simpan kredensial dengan aman\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // 5. PROSES E-BOOK ITEMS (jika ada)
    if (ebookItems.length > 0) {
      console.log(`[Fulfillment] Processing ${ebookItems.length} E-book items...`);

      message += `📚 *E-BOOK PREMIUM*\n\n`;
      
      for (const item of ebookItems) {
        const product = item.products;
        const quantity = item.quantity;
        
        message += `📖 *${product.name}*`;
        if (quantity > 1) {
          message += ` (${quantity}x)\n`;
        } else {
          message += `\n`;
        }
        
        if (product.file_url) {
          message += `🔗 Download: ${product.file_url}\n`;
          console.log(`[Fulfillment] E-book ${product.name} - file URL included`);
        } else {
          message += `⚠️ Link download akan dikirim segera via email\n`;
          console.warn(`[Fulfillment] E-book ${product.name} - missing file_url`);
        }
        message += `\n`;
      }
      
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💡 *Info E-book*\n\n`;
      message += `  ✓ Format PDF Berkualitas HD\n`;
      message += `  ✓ Akses Selamanya\n`;
      message += `  ✓ Bisa Download Kapan Saja\n`;
      message += `  ✓ Update Gratis (Jika Ada)\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // 6. Closing message
    message += `_Jika ada pertanyaan, jangan ragu untuk menghubungi kami._\n`;
    message += `Terima kasih atas kepercayaan Anda. 🙏\n\n`;
    message += `_Pesan otomatis - Mohon tidak membalas_`;

    // 7. Kirim WhatsApp
    const target = String(order.buyer_phone || "").trim();
    if (!target) {
      console.error("[Fulfillment] Nomor WhatsApp kosong di order:", orderId);
      return { success: false, error: "Nomor WhatsApp di order kosong" };
    }

    console.log(`[Fulfillment] Sending WhatsApp to ${target}...`);
    const waResult = await sendWhatsAppMessage(target, message);

    if (!waResult.success) {
      console.error("[Fulfillment] Gagal kirim WA:", waResult.error, waResult.raw);
      return {
        success: false,
        error: "Gagal mengirim WhatsApp ke pembeli",
      };
    }

    console.log(`[Fulfillment] WhatsApp sent successfully`);

    // 8. Log WhatsApp ke database
    await supabase.from("whatsapp_logs").insert({
      order_id: orderId,
      to_number: target,
      message: message,
      status: waResult.success ? "sent" : "failed",
      response_raw: waResult.raw,
    });

    console.log(`[Fulfillment] WhatsApp log saved`);

    // 9. Update status order jadi completed
    const updatePayload: any = { status: "completed" };
    if (paymentInfo?.payment_method) {
      updatePayload.payment_reference = paymentInfo.payment_method;
    }

    const { error: orderUpdateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (orderUpdateErr) {
      console.error("[Fulfillment] Gagal update status order:", orderUpdateErr);
      // tapi WA sudah terkirim, jadi kita anggap success aja
      return { success: true };
    }

    console.log(`[Fulfillment] ✅ Order ${orderId} completed successfully!`);
    return { success: true };
  } catch (err: any) {
    console.error("[Fulfillment] 💥 Fatal error:", err);
    return {
      success: false,
      error: err?.message || "Error tidak diketahui saat memproses order",
    };
  }
}