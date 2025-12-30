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
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

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
        .select(`
          id,
          quantity,
          effective_unit_count,
          unit_price,
          total_price,
          products (
            name,
            unit_count
          )
        `)
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      paid: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
    };

    const icons = {
      pending: "⏳",
      paid: "💳",
      completed: "✅",
      cancelled: "❌",
    };

    return {
      className: styles[status as keyof typeof styles] || styles.pending,
      icon: icons[status as keyof typeof icons] || "📦",
    };
  };

  const statusBadge = order ? getStatusBadge(order.status) : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("id-ID", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      }),
      time: date.toLocaleTimeString("id-ID", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
    };
  };

  const downloadInvoice = async () => {
    if (!order) return;
    
    setDownloading(true);

    try {
      const formattedDate = formatDate(order.created_at);
      
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${orderId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              background: #f8fafc;
              color: #1e293b;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #10b981;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
            }
            .invoice-info {
              text-align: right;
            }
            .invoice-info h1 {
              font-size: 24px;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .invoice-info .invoice-id {
              font-size: 12px;
              color: #64748b;
              font-family: monospace;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 8px;
              text-transform: uppercase;
            }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #dbeafe; color: #1e40af; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 32px;
            }
            .info-box {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
            }
            .info-box h3 {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            .info-item {
              margin-bottom: 12px;
            }
            .info-item:last-child { margin-bottom: 0; }
            .info-label {
              font-size: 11px;
              color: #94a3b8;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              color: #1e293b;
              font-weight: 500;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .items-table thead {
              background: #f1f5f9;
            }
            .items-table th {
              padding: 12px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .items-table td {
              padding: 16px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
              color: #334155;
            }
            .items-table tbody tr:last-child td {
              border-bottom: none;
            }
            .item-name {
              font-weight: 600;
              color: #1e293b;
            }
            .item-details {
              font-size: 11px;
              color: #64748b;
              margin-top: 4px;
            }
            .text-right { text-align: right; }
            
            .summary {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-top: 24px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .summary-row.total {
              border-top: 2px solid #e2e8f0;
              margin-top: 8px;
              padding-top: 16px;
              font-size: 18px;
              font-weight: bold;
              color: #10b981;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            .footer strong {
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="logo">IRA STORE</div>
                <p style="font-size: 12px; color: #64748b; margin-top: 4px;">E-Commerce Digital #1</p>
              </div>
              <div class="invoice-info">
                <h1>INVOICE</h1>
                <div class="invoice-id">ID: ${orderId}</div>
                <span class="status-badge status-${order.status}">${order.status}</span>
              </div>
            </div>

            <div class="info-section">
              <div class="info-box">
                <h3>Informasi Customer</h3>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${order.buyer_email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">WhatsApp</div>
                  <div class="info-value">${order.buyer_phone}</div>
                </div>
              </div>

              <div class="info-box">
                <h3>Informasi Transaksi</h3>
                <div class="info-item">
                  <div class="info-label">Tanggal & Waktu</div>
                  <div class="info-value">${formattedDate.date}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${formattedDate.time} WIB</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Reference</div>
                  <div class="info-value">${order.payment_reference || "Belum ada"}</div>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Produk</th>
                  <th>Qty</th>
                  <th class="text-right">Harga</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, idx) => `
                  <tr>
                    <td>
                      <div class="item-name">${idx + 1}. ${item.product_name}</div>
                      <div class="item-details">
                        ${item.product_unit_count} akun/paket × ${item.quantity} paket = ${item.effective_unit_count} akun total
                      </div>
                    </td>
                    <td>${item.quantity}</td>
                    <td class="text-right">Rp ${item.unit_price.toLocaleString("id-ID")}</td>
                    <td class="text-right">Rp ${item.total_price.toLocaleString("id-ID")}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Total Akun:</span>
                <span style="font-weight: 600;">${totalUnits} akun</span>
              </div>
              <div class="summary-row total">
                <span>TOTAL PEMBAYARAN:</span>
                <span>Rp ${grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>Terima kasih atas pembelian Anda!</strong></p>
              <p style="margin-top: 8px;">Jika ada pertanyaan, silakan hubungi customer service kami.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderId?.slice(0, 8)}-${new Date().getTime()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-sm">Kembali ke Dashboard</span>
          </button>

          {order && (
            <button
              onClick={() => copyToClipboard(order.id)}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all"
              title="Copy Order ID"
            >
              <span className="text-xs text-slate-500 font-mono">
                Order #{orderId?.slice(0, 8)}...
              </span>
              {copied ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
            </div>
            <p className="text-slate-400 animate-pulse">Memuat detail order...</p>
          </div>
        ) : !order ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="text-6xl opacity-50">📦</div>
            <p className="text-red-400 text-lg font-medium">Order tidak ditemukan</p>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-sm">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
              
              <div className="relative p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
                        Detail Order
                      </h1>
                      {statusBadge && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                          <span>{statusBadge.icon}</span>
                          <span className="capitalize">{order.status}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400">
                        ID: <span className="font-mono text-slate-300">{order.id}</span>
                      </p>
                      <button
                        onClick={() => copyToClipboard(order.id)}
                        className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors"
                        title="Copy Order ID"
                      >
                        {copied ? "✓ Copied!" : "📋 Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Informasi Customer
                    </h3>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/40 border border-slate-800/50">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <p className="text-sm text-slate-200 font-medium truncate">
                            {order.buyer_email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/40 border border-slate-800/50">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">WhatsApp</p>
                          <p className="text-sm text-slate-200 font-medium">
                            {order.buyer_phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Informasi Transaksi
                    </h3>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/40 border border-slate-800/50">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Tanggal & Waktu</p>
                          <p className="text-sm text-slate-200 font-medium">
                            {formatDate(order.created_at).date}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(order.created_at).time} WIB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/40 border border-slate-800/50">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Payment Reference</p>
                          <p className="text-sm text-slate-200 font-medium font-mono truncate">
                            {order.payment_reference || "Belum ada"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-100">
                    Item Pesanan
                  </h2>
                  <span className="text-xs text-slate-500">
                    {items.length} item
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl opacity-30">📦</div>
                    <p className="text-slate-400 text-sm">Tidak ada item dalam order ini</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="group relative rounded-xl border border-slate-800/50 bg-slate-950/40 p-4 hover:border-emerald-500/30 transition-all"
                        >
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {idx + 1}
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-slate-100 text-base">
                                {item.product_name}
                              </h3>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  <span>{item.product_unit_count} akun/paket</span>
                                </div>
                                <span>×</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                  <span>{item.quantity} paket</span>
                                </div>
                                <span>=</span>
                                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>{item.effective_unit_count} akun total</span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-500">
                                @ Rp {item.unit_price.toLocaleString("id-ID")}/paket
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-100">
                                Rp {item.total_price.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Total Akun</span>
                        <span className="font-semibold text-slate-200 text-base">
                          {totalUnits} akun
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-slate-300">
                          Total Pembayaran
                        </span>
                        <span className="text-2xl font-bold text-emerald-400">
                          Rp {grandTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={downloadInvoice}
                disabled={downloading}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice PDF
                  </>
                )}
              </button>
              
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}