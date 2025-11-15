"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ClipboardList,
  Package,
  CircleDollarSign,
  DatabaseZap,
  LogOut,
  Search,
  X,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Trash2,
  Eye,
  Filter,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

interface OrderRow {
  id: string;
  buyer_email: string;
  buyer_phone: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface StockAccount {
  id: string;
  username: string;
  password: string;
  is_used: boolean;
  created_at: string;
}

// Toast Component
function Toast({ message, type = "success", onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top-5 ${
        type === "success"
          ? "bg-emerald-500/90 border-emerald-400 text-white"
          : type === "error"
          ? "bg-red-500/90 border-red-400 text-white"
          : "bg-blue-500/90 border-blue-400 text-white"
      }`}
    >
      {type === "success" && <CheckCircle2 className="w-5 h-5" />}
      {type === "error" && <AlertCircle className="w-5 h-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = "danger" }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full ${
                type === "danger" ? "bg-red-500/20" : "bg-blue-500/20"
              }`}
            >
              {type === "danger" ? (
                <AlertCircle className="w-6 h-6 text-red-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-50">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-all"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                type === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              }`}
            >
              {type === "danger" ? "Hapus" : "Konfirmasi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "finance">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stockAccounts, setStockAccounts] = useState<StockAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search states
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  // Order filter
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "completed">("all");

  // Stock form state
  const [showAddStock, setShowAddStock] = useState(false);
  const [singleUsername, setSingleUsername] = useState("");
  const [singlePassword, setSinglePassword] = useState("");
  const [bulkStockText, setBulkStockText] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  // Bulk selection stok
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<any>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
  };

  // ===== AUTH CEK =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = window.localStorage.getItem("ds_admin_auth");
    if (auth !== "yes") {
      router.push("/admin/login");
    }
  }, [router]);

  // ===== LOAD ORDERS =====
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, buyer_email, buyer_phone, status, total_price, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load orders error:", error);
        showToast("Gagal memuat pesanan", "error");
      } else if (data) {
        setOrders(data as OrderRow[]);
      }
      setLoading(false);
    }
    loadOrders();
  }, []);

  // ===== LOAD STOCK =====
  async function loadStock() {
    const { data, error } = await supabase
      .from("accounts_stock")
      .select("id, username, password, is_used, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load stock error:", error);
      showToast("Gagal memuat stok", "error");
    } else if (data) {
      setStockAccounts(data as StockAccount[]);
    }
  }

  useEffect(() => {
    if (activeTab === "stock") {
      loadStock();
    }
  }, [activeTab]);

  // ===== ORDER ACTIONS =====
  async function markPaid(orderId: string) {
    setProcessingId(orderId);
    try {
      const res = await fetch("/api/orders/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`Gagal memproses order: ${data.error}`, "error");
      } else {
        showToast("Order berhasil diproses dan WA dikirim! 🎉", "success");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      console.error("Mark paid error:", err);
      showToast(`Error: ${err.message || "Terjadi kesalahan"}`, "error");
    } finally {
      setProcessingId(null);
    }
  }

  // ===== STOCK ACTIONS =====
  async function handleAddStock() {
    if (!bulkMode) {
      if (!singleUsername.trim() || !singlePassword.trim()) {
        showToast("Username dan password harus diisi", "error");
        return;
      }

      setAddingStock(true);
      try {
        const { data, error } = await supabase
          .from("accounts_stock")
          .insert([
            {
              username: singleUsername.trim(),
              password: singlePassword.trim(),
              is_used: false,
            },
          ])
          .select();

        if (error) {
          console.error("Insert stock error:", error);
          showToast("Gagal menambahkan akun: " + error.message, "error");
        } else {
          showToast("Berhasil menambahkan 1 akun! ✨", "success");
          setSingleUsername("");
          setSinglePassword("");
          setShowAddStock(false);
          loadStock();
        }
      } catch (err: any) {
        console.error("Add stock error:", err);
        showToast("Error: " + err.message, "error");
      } finally {
        setAddingStock(false);
      }
      return;
    }

    if (!bulkStockText.trim()) {
      showToast("Masukkan data akun terlebih dahulu", "error");
      return;
    }

    setAddingStock(true);
    try {
      const lines = bulkStockText.trim().split("\n");
      const accounts = lines
        .map((line) => {
          const parts = line.split("|");
          if (parts.length >= 2) {
            const username = parts[0].trim();
            const password = parts[1].trim();
            if (username && password) {
              return { username, password, is_used: false };
            }
          }
          return null;
        })
        .filter(Boolean) as { username: string; password: string; is_used: boolean }[];

      if (accounts.length === 0) {
        showToast("Format tidak valid. Gunakan: username|password", "error");
        setAddingStock(false);
        return;
      }

      const { data, error } = await supabase
        .from("accounts_stock")
        .insert(accounts)
        .select();

      if (error) {
        console.error("Insert stock error:", error);
        showToast("Gagal menambahkan stok: " + error.message, "error");
      } else {
        showToast(`Berhasil menambahkan ${accounts.length} akun! 🚀`, "success");
        setBulkStockText("");
        setShowAddStock(false);
        loadStock();
      }
    } catch (err: any) {
      console.error("Add stock error:", err);
      showToast("Error: " + err.message, "error");
    } finally {
      setAddingStock(false);
    }
  }

  async function deleteStock(id: string) {
    setConfirmModal({
      title: "Hapus Akun?",
      message: "Akun yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?",
      type: "danger",
      onConfirm: async () => {
        const { error } = await supabase.from("accounts_stock").delete().eq("id", id);

        if (error) {
          showToast("Gagal menghapus: " + error.message, "error");
        } else {
          showToast("Akun berhasil dihapus!", "success");
          setStockAccounts((prev) => prev.filter((s) => s.id !== id));
          setSelectedStockIds((prev) => prev.filter((sid) => sid !== id));
        }
      },
    });
  }

  const toggleStockSelection = (id: string) => {
    setSelectedStockIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const filtered = filteredStockAccounts;
    const allSelected = filtered.every((acc) => selectedStockIds.includes(acc.id));
    
    if (allSelected) {
      setSelectedStockIds((prev) => prev.filter((id) => !filtered.find((a) => a.id === id)));
    } else {
      setSelectedStockIds((prev) => [...new Set([...prev, ...filtered.map((a) => a.id)])]);
    }
  };

  async function bulkDeleteSelectedStock() {
    setConfirmModal({
      title: "Hapus Akun Terpilih?",
      message: `${selectedStockIds.length} akun akan dihapus secara permanen. Yakin ingin melanjutkan?`,
      type: "danger",
      onConfirm: async () => {
        const { error } = await supabase
          .from("accounts_stock")
          .delete()
          .in("id", selectedStockIds);

        if (error) {
          showToast("Gagal menghapus akun terpilih: " + error.message, "error");
        } else {
          showToast("Berhasil menghapus akun terpilih! 🗑️", "success");
          setStockAccounts((prev) =>
            prev.filter((acc) => !selectedStockIds.includes(acc.id))
          );
          setSelectedStockIds([]);
        }
      },
    });
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ===== DERIVED DATA =====
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const availableStock = stockAccounts.filter((s) => !s.is_used).length;
  const usedStock = stockAccounts.filter((s) => s.is_used).length;

  // Filtered orders with search
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (orderFilter === "pending") {
      filtered = filtered.filter((o) => o.status === "pending");
    } else if (orderFilter === "completed") {
      filtered = filtered.filter((o) => o.status === "completed");
    }

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.buyer_email.toLowerCase().includes(query) ||
          o.buyer_phone?.toLowerCase().includes(query) ||
          o.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, orderFilter, orderSearchQuery]);

  // Filtered stock with search
  const filteredStockAccounts = useMemo(() => {
    if (!stockSearchQuery.trim()) return stockAccounts;

    const query = stockSearchQuery.toLowerCase();
    return stockAccounts.filter(
      (acc) =>
        acc.username.toLowerCase().includes(query) ||
        acc.password.toLowerCase().includes(query) ||
        acc.id.toLowerCase().includes(query)
    );
  }, [stockAccounts, stockSearchQuery]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  return (
    <main
      className={`${inter.variable} ${poppins.variable} min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 font-sans`}
    >
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 backdrop-blur-sm">
                Admin Panel
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {today}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              Dashboard Admin
              <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Live
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-3 max-w-2xl leading-relaxed">
              Pantau pesanan, kelola stok akun digital, dan lihat performa
              pendapatan secara terpusat dalam satu halaman.
            </p>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("ds_admin_auth");
              }
              router.push("/admin/login");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-sm font-medium text-slate-200 transition-all bg-slate-900/40 hover:bg-slate-800/60 hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="group border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-slate-300" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Total Pesanan
            </p>
            <p className="text-4xl font-bold text-slate-50">
              {loading ? (
                <span className="inline-block h-8 w-20 rounded-lg bg-slate-800 animate-pulse" />
              ) : (
                orders.length
              )}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Semua pesanan masuk (pending + selesai)
            </p>
          </div>

          <div className="group border border-slate-800 bg-gradient-to-br from-amber-900/10 via-slate-900 to-slate-950 rounded-2xl p-6 shadow-lg hover:shadow-amber-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-amber-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-amber-300" />
              </div>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pending
            </p>
            <p className="text-4xl font-bold text-yellow-400">
              {loading ? (
                <span className="inline-block h-8 w-20 rounded-lg bg-slate-800 animate-pulse" />
              ) : (
                pendingOrders
              )}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Menunggu konfirmasi & pengiriman akses
            </p>
          </div>

          <div className="group border border-slate-800 bg-gradient-to-br from-emerald-900/10 via-slate-900 to-slate-950 rounded-2xl p-6 shadow-lg hover:shadow-emerald-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DatabaseZap className="w-6 h-6 text-emerald-300" />
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Stok Tersedia
            </p>
            <p className="text-4xl font-bold text-emerald-400">{availableStock}</p>
            <p className="mt-3 text-xs text-slate-500">
              Siap dikirim ke pembeli
            </p>
          </div>

          <div className="group border border-slate-800 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-950 rounded-2xl p-6 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CircleDollarSign className="w-6 h-6 text-emerald-100" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Total Pendapatan
            </p>
            <p className="text-4xl font-bold text-emerald-400">
              Rp{" "}
              {totalRevenue.toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Akumulasi dari pesanan selesai
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20 rounded-t-2xl">
          <div className="flex gap-2 p-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Pesanan
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/30">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "stock"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <DatabaseZap className="w-4 h-4" />
              Stok Akun
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/30">
                {availableStock}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("finance")}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "finance"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <CircleDollarSign className="w-4 h-4" />
              Keuangan
            </button>
          </div>
        </div>

        {/* Tab Content: Orders */}
        {activeTab === "orders" && (
          <section className="border border-slate-800 bg-slate-900/80 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    Daftar Pesanan
                    {pendingOrders > 0 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold">
                        {pendingOrders} perlu diproses
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Kelola pesanan customer dan kirim akses setelah verifikasi
                  </p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl p-1.5">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-4 py-2 rounded-lg transition-all font-medium ${
                      orderFilter === "all"
                        ? "bg-slate-800 text-slate-50 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setOrderFilter("pending")}
                    className={`px-4 py-2 rounded-lg transition-all font-medium ${
                      orderFilter === "pending"
                        ? "bg-amber-500/20 text-amber-100 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-4 py-2 rounded-lg transition-all font-medium ${
                      orderFilter === "completed"
                        ? "bg-emerald-500/20 text-emerald-100 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Selesai
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari email, nomor WA, atau ID pesanan..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/80 p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-4 w-48 rounded-lg bg-slate-800" />
                      <div className="h-5 w-24 rounded-full bg-slate-800" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-32 rounded bg-slate-800" />
                      <div className="h-3 w-40 rounded bg-slate-800" />
                      <div className="h-3 w-36 rounded bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-300">
                    {orderSearchQuery ? "Tidak ada hasil pencarian" : "Belum ada pesanan"}
                  </p>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                    {orderSearchQuery
                      ? `Tidak ditemukan pesanan dengan kata kunci "${orderSearchQuery}"`
                      : "Pesanan akan muncul di sini setelah customer checkout"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-950/60 transition-all group"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-base truncate max-w-xs group-hover:text-emerald-400 transition-colors">
                          {order.buyer_email}
                        </p>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                            order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : order.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {order.status === "pending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {order.status === "pending"
                            ? "Pending"
                            : order.status === "completed"
                            ? "Selesai"
                            : order.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        WhatsApp:{" "}
                        <span className="font-mono font-medium">
                          {order.buyer_phone || "-"}
                        </span>
                      </p>
                      <p className="text-sm text-emerald-400 font-bold">
                        Rp{" "}
                        {(order.total_price || 0).toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString("id-ID", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all hover:scale-105"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Detail
                      </button>

                      {order.status === "pending" && (
                        <button
                          onClick={() => markPaid(order.id)}
                          disabled={processingId === order.id}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
                        >
                          {processingId === order.id ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Proses & Kirim
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab Content: Stock */}
        {activeTab === "stock" && (
          <section className="space-y-5">
            <div className="border border-slate-800 bg-slate-900/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Stok Akun</h2>
                <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {availableStock} tersedia · {usedStock} terpakai
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Pastikan stok selalu cukup sebelum kampanye penjualan
                </p>
              </div>
              <button
                onClick={() => setShowAddStock(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
              >
                <DatabaseZap className="w-4 h-4" />
                Tambah Stok
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari username, password, atau ID akun..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {stockSearchQuery && (
                <button
                  onClick={() => setStockSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bulk actions bar */}
            {selectedStockIds.length > 0 && (
              <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm shadow-lg">
                <p className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <strong>{selectedStockIds.length}</strong> akun dipilih
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={bulkDeleteSelectedStock}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-bold transition-all hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Terpilih
                  </button>
                  <button
                    onClick={() => setSelectedStockIds([])}
                    className="px-4 py-2 rounded-lg border border-amber-400/50 text-sm font-medium hover:bg-amber-500/15 transition-all"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            )}

            <div className="border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">Daftar Akun</h3>
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  {filteredStockAccounts.length} dari {stockAccounts.length} akun
                </span>
              </div>

              {/* Header row */}
              {filteredStockAccounts.length > 0 && (
                <div className="hidden md:flex items-center px-6 py-3 text-xs font-bold text-slate-400 border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider">
                  <div className="w-10 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 cursor-pointer"
                      checked={
                        filteredStockAccounts.length > 0 &&
                        filteredStockAccounts.every((acc) =>
                          selectedStockIds.includes(acc.id)
                        )
                      }
                      onChange={toggleSelectAllVisible}
                    />
                  </div>
                  <div className="flex-1">Kredensial Akun</div>
                  <div className="w-32 text-center">Status</div>
                  <div className="w-32 text-right">Aksi</div>
                </div>
              )}

              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                {filteredStockAccounts.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      {stockSearchQuery ? (
                        <Search className="w-10 h-10 text-slate-600" />
                      ) : (
                        <DatabaseZap className="w-10 h-10 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-300">
                        {stockSearchQuery ? "Tidak ada hasil pencarian" : "Belum ada stok akun"}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {stockSearchQuery
                          ? `Tidak ditemukan akun dengan kata kunci "${stockSearchQuery}"`
                          : 'Klik "Tambah Stok" untuk memasukkan akun baru'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredStockAccounts.map((acc) => {
                    const checked = selectedStockIds.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        className="p-5 flex items-center gap-4 hover:bg-slate-950/60 transition-all group"
                      >
                        <div className="shrink-0">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-600 bg-slate-900 cursor-pointer"
                            checked={checked}
                            onChange={() => toggleStockSelection(acc.id)}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold font-mono truncate text-slate-200 group-hover:text-emerald-400 transition-colors">
                              {acc.username}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(acc.username, `user-${acc.id}`)
                              }
                              className="p-1.5 hover:bg-slate-800 rounded-lg transition-all"
                              title="Copy username"
                            >
                              {copiedId === `user-${acc.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-slate-500 font-mono">
                              {acc.password}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(acc.password, `pass-${acc.id}`)
                              }
                              className="p-1.5 hover:bg-slate-800 rounded-lg transition-all"
                              title="Copy password"
                            >
                              {copiedId === `pass-${acc.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(acc.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5 ${
                              acc.is_used
                                ? "bg-slate-700 text-slate-400"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {acc.is_used ? (
                              <>
                                <X className="w-3 h-3" />
                                Terpakai
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Tersedia
                              </>
                            )}
                          </span>
                          {!acc.is_used && (
                            <button
                              onClick={() => deleteStock(acc.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg hover:bg-red-950/30 transition-all hover:scale-105"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab Content: Finance */}
        {activeTab === "finance" && (
          <section className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="border border-slate-800 bg-gradient-to-br from-emerald-900/10 to-slate-900 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Ringkasan Keuangan
                  </h3>
                  <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">
                      Total Pendapatan
                    </span>
                    <span className="text-xl font-bold text-emerald-400">
                      Rp{" "}
                      {totalRevenue.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">
                      Pesanan Selesai
                    </span>
                    <span className="text-xl font-bold text-slate-50">
                      {completedOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">
                      Rata-rata per Order
                    </span>
                    <span className="text-xl font-bold text-slate-50">
                      Rp{" "}
                      {completedOrders > 0
                        ? Math.round(totalRevenue / completedOrders).toLocaleString("id-ID")
                        : "0"}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-slate-500 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Data berdasarkan pesanan dengan status selesai
                </p>
              </div>

              <div className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Status Pesanan
                  </h3>
                  <ClipboardList className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      Pending
                    </span>
                    <span className="text-xl font-bold text-yellow-400">
                      {pendingOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Selesai
                    </span>
                    <span className="text-xl font-bold text-emerald-400">
                      {completedOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">Total</span>
                    <span className="text-xl font-bold text-slate-50">
                      {orders.length}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-slate-500 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  Gunakan untuk analisa konversi & funnel checkout
                </p>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">Riwayat Transaksi</h3>
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Menampilkan transaksi selesai
                </span>
              </div>
              <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                {orders.filter((o) => o.status === "completed").length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <CircleDollarSign className="w-10 h-10 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-300">
                        Belum ada transaksi selesai
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Transaksi akan muncul setelah pesanan diproses
                      </p>
                    </div>
                  </div>
                ) : (
                  orders
                    .filter((o) => o.status === "completed")
                    .map((order) => (
                      <div
                        key={order.id}
                        className="p-5 flex items-center justify-between hover:bg-slate-950/60 transition-all group"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold group-hover:text-emerald-400 transition-colors">
                            {order.buyer_email}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "long",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-emerald-400 flex items-center gap-2 justify-end">
                            <TrendingUp className="w-4 h-4" />+ Rp{" "}
                            {(order.total_price || 0).toLocaleString("id-ID", {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal Popup - Add Stock */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <DatabaseZap className="w-6 h-6 text-emerald-400" />
                  Tambah Stok Akun
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Tambahkan akun baru ke database. Data akan langsung tersimpan di Supabase.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setSingleUsername("");
                  setSinglePassword("");
                  setBulkStockText("");
                  setBulkMode(false);
                }}
                className="p-2.5 hover:bg-slate-800 rounded-xl transition-all hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="border-b border-slate-800 p-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBulkMode(false)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    !bulkMode
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Tambah 1 Akun
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    bulkMode
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Bulk Import
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Gunakan mode bulk untuk memasukkan banyak akun sekaligus
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
              {!bulkMode ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-2.5 flex items-center gap-2">
                      <span>Username / Email</span>
                    </label>
                    <input
                      type="text"
                      value={singleUsername}
                      onChange={(e) => setSingleUsername(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-2.5">
                      Password
                    </label>
                    <input
                      type="text"
                      value={singlePassword}
                      onChange={(e) => setSinglePassword(e.target.value)}
                      placeholder="password123"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-300 mb-1">
                        Tips Keamanan
                      </p>
                      <p className="text-xs text-blue-300/80">
                        Gunakan password yang unik untuk setiap akun agar mudah dilacak jika terjadi masalah.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-300 block">
                    Data Akun (Bulk Import)
                  </label>

<div className="flex gap-4">
      {/* Kiri: Format */}
      <div className="w-72 flex-shrink-0 bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 h-[450px] overflow-y-auto">
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Format yang Digunakan
          </p>
          <code className="text-sm text-emerald-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg block">
            username|password
          </code>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">
            Contoh Format:
          </p>
          <pre className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded-lg whitespace-pre-wrap">
            akun1@gmail.com|password123{"\n"}akun2@gmail.com|pass456{"\n"}user3|mypassword
          </pre>
        </div>
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3">
          <p className="text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Satu akun per baris
          </p>
        </div>
      </div>

      {/* Kanan: Textarea */}
      <div className="flex-1">
        <textarea
          value={bulkStockText}
          onChange={(e) => setBulkStockText(e.target.value)}
          placeholder="contoh@gmail.com|password123&#10;akun2@gmail.com|pass456&#10;user3|mypassword"
          className="w-full h-[450px] bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono resize-none transition-all"
        />
      </div>
    </div>

                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      <strong>Tip:</strong> Gunakan pemisah{" "}
                      <code className="bg-slate-900 px-2 py-0.5 rounded">|</code>{" "}
                      (pipe) antara username dan password. Pastikan tidak ada spasi berlebih.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setSingleUsername("");
                  setSinglePassword("");
                  setBulkStockText("");
                  setBulkMode(false);
                }}
                disabled={addingStock}
                className="px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-all disabled:opacity-50 hover:scale-105"
              >
                Batal
              </button>
              <button
                onClick={handleAddStock}
                disabled={
                  addingStock ||
                  (!bulkMode &&
                    (!singleUsername.trim() || !singlePassword.trim())) ||
                  (bulkMode && !bulkStockText.trim())
                }
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
              >
                {addingStock ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {bulkMode ? "Simpan Semua" : "Simpan Akun"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}