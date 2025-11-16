// src/app/api/orders/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServerClient";
import { buildPakasirPayUrl } from "@/lib/pakasir";

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderBody {
  buyerEmail: string;
  buyerPhone: string;
  items: CreateOrderItemInput[];
}

export async function POST(req: Request) {
  try {
    // Inisialisasi Supabase Admin Client
    const supabase = getSupabaseAdmin();
    
    const body = (await req.json()) as CreateOrderBody;

    const buyerEmail = String(body.buyerEmail || "").trim();
    const buyerPhone = String(body.buyerPhone || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];

    // Validasi input
    if (!buyerEmail || !buyerPhone) {
      return NextResponse.json(
        { success: false, error: "Email dan nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { success: false, error: "Keranjang kosong" },
        { status: 400 }
      );
    }

    // Get unique product IDs
    const productIds = [...new Set(items.map((it) => it.productId))];

    // Fetch products from database - INCLUDE product_type dan file_url
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, unit_count, is_active, product_type, file_url")
      .in("id", productIds);

    if (productsError || !productsData) {
      console.error("Load products in order error:", productsError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal mengambil data produk: " +
            (productsError?.message || "unknown error"),
        },
        { status: 500 }
      );
    }

    // Create products map for quick lookup
    const productsMap = new Map(
      productsData.map((p: any) => [p.id as string, p])
    );

    // Normalize and validate items
    let normalized: {
      product: any;
      quantity: number;
      unitCount: number;
      totalPrice: number;
    }[] = [];

    try {
      normalized = items.map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) {
          throw new Error(`Produk dengan id ${item.productId} tidak ditemukan`);
        }
        if (product.is_active === false) {
          throw new Error(`Produk ${product.name} tidak aktif`);
        }

        const qty = Math.max(1, Number(item.quantity) || 1);
        const unitCount = (product.unit_count as number) * qty;
        const totalPrice = (product.price as number) * qty;

        return {
          product,
          quantity: qty,
          unitCount,
          totalPrice,
        };
      });
    } catch (e: any) {
      console.error("Normalize items error:", e);
      return NextResponse.json(
        {
          success: false,
          error: e?.message || "Keranjang mengandung produk tidak valid",
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalUnits = normalized.reduce(
      (sum, it) => sum + it.unitCount,
      0
    );
    const grandTotal = normalized.reduce(
      (sum, it) => sum + it.totalPrice,
      0
    );

    // Separate gmail and non-gmail products
    const gmailProducts = normalized.filter(
      (it) => it.product.product_type === "gmail"
    );
    const ebookProducts = normalized.filter(
      (it) => it.product.product_type === "ebook"
    );
    const otherProducts = normalized.filter(
      (it) => it.product.product_type !== "gmail" && it.product.product_type !== "ebook"
    );

    console.log(`[Order Create] Gmail: ${gmailProducts.length}, E-book: ${ebookProducts.length}, Other: ${otherProducts.length}`);

    // Check stock ONLY for gmail products
    if (gmailProducts.length > 0) {
      const totalGmailUnits = gmailProducts.reduce(
        (sum, it) => sum + it.unitCount,
        0
      );

      console.log(`[Order Create] Checking stock for ${totalGmailUnits} Gmail accounts...`);

      const { data: stockRows, error: stockErr } = await supabase
        .from("accounts_stock")
        .select("id, is_used");

      if (stockErr) {
        console.error("Stock check error:", stockErr);
        return NextResponse.json(
          {
            success: false,
            error:
              "Gagal mengecek stok akun: " +
              (stockErr?.message || "unknown error"),
          },
          { status: 500 }
        );
      }

      const availableStock = (stockRows ?? []).filter(
        (row: any) => row.is_used !== true
      ).length;

      console.log(`[Order Create] Available Gmail stock: ${availableStock}`);

      if (availableStock < totalGmailUnits) {
        return NextResponse.json(
          {
            success: false,
            error: `Stok akun Gmail tidak cukup. Tersedia: ${availableStock}, dibutuhkan: ${totalGmailUnits}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate ebook products have file_url
    for (const item of ebookProducts) {
      if (!item.product.file_url) {
        console.error(`[Order Create] E-book ${item.product.name} missing file_url`);
        return NextResponse.json(
          {
            success: false,
            error: `E-book "${item.product.name}" belum memiliki file download. Hubungi admin.`,
          },
          { status: 400 }
        );
      }
    }

    // Insert order to database
    const orderPayload: any = {
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      status: "pending",
      // payment_reference akan diisi setelah payment berhasil
    };

    const { data: orderInsert, error: orderErr } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderErr || !orderInsert) {
      console.error("Create order error:", orderErr);
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal membuat order: " +
            (orderErr?.message || "unknown error"),
        },
        { status: 500 }
      );
    }

    const orderId: string = orderInsert.id;
    console.log(`[Order Create] Order created: ${orderId}`);

    // Insert order items
    const orderItemsPayload = normalized.map((it) => ({
      order_id: orderId,
      product_id: it.product.id,
      quantity: it.quantity,
      effective_unit_count: it.unitCount,
      unit_price: it.product.price,
      total_price: it.totalPrice,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsErr) {
      console.error("Insert order items error:", itemsErr);
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal menyimpan item order: " +
            (itemsErr?.message || "unknown error"),
        },
        { status: 500 }
      );
    }

    console.log(`[Order Create] ${orderItemsPayload.length} items inserted`);

    // Build payment URL using Pakasir
    const paymentUrl = buildPakasirPayUrl({
      orderId,
      amount: grandTotal,
    });

    if (!paymentUrl) {
      console.error("Failed to build payment URL");
      return NextResponse.json(
        {
          success: false,
          error: "Gagal membuat URL pembayaran. Hubungi admin.",
        },
        { status: 500 }
      );
    }

    console.log(`[Order Create] Payment URL created for order ${orderId}`);

    return NextResponse.json(
      {
        success: true,
        orderId,
        totalUnits,
        grandTotal,
        paymentUrl,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("orders/create fatal error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "Terjadi kesalahan di server: " + (err?.message || "unknown error"),
      },
      { status: 500 }
    );
  }
}