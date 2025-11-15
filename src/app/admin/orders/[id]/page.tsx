"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface OrderDetail {
  id: string;
  buyer_email: string;
  buyer_phone: string;
  status: string;
  payment_reference: string | null;
  created_at: string;
}

interface OrderItemWithProduct {
  id: string;
  quantity: number;
  effective_unit_count: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_unit_count: number;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // cek auth sederhana
      if (typeof window !== "undefined") {
        const auth = localStorage.getItem("ds_admin_auth");
        if (auth !== "yes") {
          router.push("/admin/login");
          return;
        }
      }

      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("id, buyer_email, buyer_phone, status, payment_reference, created_at")
        .eq("id", orderId)
        .single();

      if (orderErr || !orderData) {
        console.error("Order detail error:", orderErr);
        setLoading(false);
        return;
      }

      setOrder(orderData as OrderDetail);

      const { data: itemsData, error: itemsErr } = await supabase
        .from("order_items")
        .select(
          `
          id,
          quantity,
          effective_unit_count,
          unit_price,
          total_price,
          products (
            name,
            unit_count
          )
        `
        )
        .eq("order_id", orderId);

      if (itemsErr || !itemsData) {
        console.error("Order items detail error:", itemsErr);
        setItems([]);
      } else {
        const mapped = (itemsData as any[]).map((row) => ({
          id: row.id,
          quantity: row.quantity,
          effective_unit_count: row.effective_unit_count,
          unit_price: row.unit_price,
          total_price: row.total_price,
          product_name: row.products?.name ?? "Unknown",
          product_unit_count: row.products?.unit_count ?? 0,
        }));
        setItems(mapped);
      }

      setLoading(false);
    }

    if (orderId) {
      load();
    }
  }, [orderId, router]);

  const grandTotal = items.reduce((sum, it) => sum + it.total_price, 0);
  const totalUnits = items.reduce((sum, it) => sum + it.effective_unit_count, 0);

  return (
    <main className="max-w-3xl mx-auto py-8 space-y-6">
      <button
        onClick={() => router.push("/admin/dashboard")}
        className="text-xs text-slate-400 hover:text-slate-200"
      >
        ← Kembali ke Dashboard
      </button>

      {loading ? (
        <p className="text-slate-400">Memuat detail order...</p>
      ) : !order ? (
        <p className="text-red-400">Order tidak ditemukan.</p>
      ) : (
        <>
          <section className="border border-slate-800 bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
            <h1 className="text-xl font-semibold mb-2">Detail Order</h1>
            <p>
              <span className="text-slate-400">Order ID:</span>{" "}
              <span className="font-mono">{order.id}</span>
            </p>
            <p>
              <span className="text-slate-400">Email:</span>{" "}
              {order.buyer_email}
            </p>
            <p>
              <span className="text-slate-400">WhatsApp:</span>{" "}
              {order.buyer_phone}
            </p>
            <p>
              <span className="text-slate-400">Status:</span>{" "}
              <span className="font-semibold">{order.status}</span>
            </p>
            <p>
              <span className="text-slate-400">Payment Ref:</span>{" "}
              {order.payment_reference || "-"}
            </p>
            <p className="text-xs text-slate-500">
              Dibuat:{" "}
              {new Date(order.created_at).toLocaleString("id-ID")}
            </p>
          </section>

          <section className="border border-slate-800 bg-slate-900 rounded-lg p-4 space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Item dalam Order</h2>

            {items.length === 0 ? (
              <p className="text-slate-400">Tidak ada item.</p>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="border border-slate-800 rounded-md p-3"
                  >
                    <p className="font-semibold">{it.product_name}</p>
                    <p className="text-xs text-slate-400">
                      {it.product_unit_count} akun / paket × {it.quantity} paket
                      = {it.effective_unit_count} akun
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Harga paket: Rp{" "}
                      {it.unit_price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm font-semibold">
                      Subtotal: Rp{" "}
                      {it.total_price.toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}

                <div className="border-t border-slate-800 pt-2 flex justify-between">
                  <span>Total akun</span>
                  <span className="font-semibold">{totalUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pembayaran</span>
                  <span className="font-semibold">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
