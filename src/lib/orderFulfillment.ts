// src/lib/orderFulfillment.ts

import { db } from "./db"; // Gunakan Prisma, bukan Supabase
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

    // 1. Ambil order beserta item, info produk, dan affiliate (pakai Prisma)
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true, // Ambil relasi produk
          },
        },
        affiliate: true, // Ambil data affiliate jika ada
      },
    });

    if (!order) {
      console.error("[Fulfillment] Order not found in DB");
      return { success: false, error: "Order tidak ditemukan" };
    }

    console.log(`[Fulfillment] Order found. Current status: ${order.status}`);

    // Kalau sudah paid/completed, jangan kirim dobel & jangan kasih komisi dobel
    if (order.status === "paid" || order.status === "completed") {
      console.log("[Fulfillment] Order sudah diproses sebelumnya:", orderId);
      return { success: true };
    }

    const items = order.orderItems;
    if (!items || items.length === 0) {
      console.error("[Fulfillment] Order items empty");
      return {
        success: false,
        error: "Item order tidak ditemukan untuk order ini",
      };
    }

    console.log(`[Fulfillment] Found ${items.length} items in order`);

    // 2. Pisahkan berdasarkan product type
    const gmailItems = items.filter((item) => item.product.productType === "gmail");
    const ebookItems = items.filter((item) => item.product.productType === "ebook");
    const templateItems = items.filter((item) => item.product.productType === "template");

    console.log(`[Fulfillment] Items: Gmail=${gmailItems.length}, Ebook=${ebookItems.length}, Template=${templateItems.length}`);

    let message = `*✅ KONFIRMASI PEMBAYARAN*\n`;
    message += `Pembayaran Anda telah berhasil diverifikasi.\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *INFORMASI PESANAN*\n`;
    message += `  Order ID: ${orderId}\n`;
    message += `  Email: ${order.buyerEmail}\n`;
    if (paymentInfo?.payment_method) {
      message += `  Metode: ${paymentInfo.payment_method}\n`;
    }
    if (paymentInfo?.amount) {
      message += `  Total: Rp ${paymentInfo.amount.toLocaleString("id-ID")}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // 3. PROSES GMAIL ITEMS (jika ada)
    if (gmailItems.length > 0) {
      const totalGmailUnits = gmailItems.reduce(
        (sum, it) => sum + it.effectiveUnitCount,
        0
      );

      console.log(`[Fulfillment] Fetching ${totalGmailUnits} Gmail accounts...`);

      // Ambil stok akun Gmail
      const availableAccounts = await db.accountsStock.findMany({
        where: { isUsed: false },
        take: totalGmailUnits,
      });

      console.log(`[Fulfillment] Available Gmail stock: ${availableAccounts.length}`);

      if (availableAccounts.length < totalGmailUnits) {
        console.error(
          `[Fulfillment] Stok Gmail kurang. Dibutuhkan ${totalGmailUnits}, tersedia ${availableAccounts.length}`
        );
        return {
          success: false,
          error: "Stok akun Gmail kurang untuk memproses order ini",
        };
      }

      // Tandai stok sebagai terpakai dengan assigned_order_item_id
      console.log(`[Fulfillment] Marking Gmail accounts as used...`);
      let stockIndex = 0;
      for (const item of gmailItems) {
        const accountsForItem = availableAccounts.slice(
          stockIndex,
          stockIndex + item.effectiveUnitCount
        );
        const accountIds = accountsForItem.map((a) => a.id);

        console.log(`[Fulfillment] Assigning ${accountIds.length} accounts to item ${item.id}`);

        // Update menggunakan Prisma
        await db.accountsStock.updateMany({
          where: { id: { in: accountIds } },
          data: {
            isUsed: true,
            assignedOrderItemId: item.id,
          },
        });

        stockIndex += item.effectiveUnitCount;
      }

      console.log(`[Fulfillment] Gmail stock updated successfully`);

      // Build pesan akun Gmail
      message += `🔐 *AKUN GMAIL* (${totalGmailUnits} akun)\n\n`;
      const lines = availableAccounts.map((acc) => {
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

    // 4. PROSES E-BOOK ITEMS
    if (ebookItems.length > 0) {
      message += `📚 *E-BOOK PREMIUM*\n\n`;
      for (const item of ebookItems) {
        message += `📖 *${item.product.name}*`;
        if (item.quantity > 1) message += ` (${item.quantity}x)\n`;
        else message += `\n`;
        
        if (item.product.fileUrl) message += `🔗 Download: ${item.product.fileUrl}\n`;
        else message += `⚠️ Link download akan dikirim segera via email\n`;
        message += `\n`;
      }
    }

    // 5. PROSES TEMPLATE ITEMS
    if (templateItems.length > 0) {
      message += `💻 *WORDPRESS TEMPLATES*\n\n`;
      for (const item of templateItems) {
        message += `📂 *${item.product.name}*`;
        if (item.quantity > 1) message += ` (${item.quantity}x)\n`;
        else message += `\n`;
        
        if (item.product.fileUrl) message += `🔗 Download: ${item.product.fileUrl}\n`;
        else message += `⚠️ Link download akan dikirim segera via email\n`;
        message += `\n`;
      }
    }

    // 6. Closing message
    message += `_Jika ada pertanyaan, jangan ragu untuk menghubungi kami._\n`;
    message += `Terima kasih atas kepercayaan Anda. 🙏\n\n`;
    message += `_Pesan otomatis - Mohon tidak membalas_`;

    // 7. Kirim WhatsApp
    const target = String(order.buyerPhone || "").trim();
    if (!target) {
      return { success: false, error: "Nomor WhatsApp di order kosong" };
    }

    console.log(`[Fulfillment] Sending WhatsApp to ${target}...`);
    const waResult = await sendWhatsAppMessage(target, message);

    if (!waResult.success) {
      console.error("[Fulfillment] Gagal kirim WA:", waResult.error);
      return { success: false, error: "Gagal mengirim WhatsApp ke pembeli" };
    }

    // 8. Log WhatsApp ke database
    await db.whatsappLog.create({
      data: {
        orderId: orderId,
        toNumber: target,
        message: message,
        status: waResult.success ? "sent" : "failed",
        responseRaw: waResult.raw ? JSON.parse(JSON.stringify(waResult.raw)) : null,
      },
    });

    // ==========================================
    // 9. FITUR BARU: SISTEM KOMISI AFFILIATE
    // ==========================================
    if (order.affiliateId && paymentInfo?.amount) {
      // SETTING KOMISI: Misalnya 10% dari total belanja
      const KOMISI_PERSEN = 0.10; 
      const nominalKomisi = Math.floor(paymentInfo.amount * KOMISI_PERSEN);

      try {
        await db.affiliate.update({
          where: { id: order.affiliateId },
          data: {
            balance: {
              increment: nominalKomisi // Otomatis nambah saldo di TiDB
            }
          }
        });
        console.log(`[Fulfillment] 💰 Komisi Rp${nominalKomisi} ditambahkan ke Affiliate ID: ${order.affiliateId}`);
      } catch (affErr) {
        console.error("[Fulfillment] Gagal menambah komisi affiliate:", affErr);
        // Kita tidak mereturn error di sini karena WA dan Order sudah diproses
      }
    }

    // 10. Update status order jadi completed
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "completed",
        paymentReference: paymentInfo?.payment_method || null,
      },
    });

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