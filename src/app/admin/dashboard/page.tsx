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
  RefreshCw,
  LayoutTemplate,
  Lock,
  Unlock,
  Tag,
} from "lucide-react";
import { Inter, Poppins } from "next/font/google";
import { BookOpen, Plus, Edit, Link as LinkIcon } from "lucide-react";

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
  created_at: string;
  order_items?: Array<{
    total_price: number;
  }>;
}

interface OrderWithTotal extends OrderRow {
  total_price: number;
}

interface StockAccount {
  id: string;
  username: string;
  password: string;
  is_used: boolean;
  created_at: string;
}

interface EbookProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  unit_count: number;
  is_active: boolean;
  file_url: string | null;
  created_at: string;
}
function Toast({ message, type = "success", onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top-5 ${
        type === "success"
          ? "bg-emerald-500/90 border-emerald-400 text-white"
          : type === "error"
          ? "bg-red-500/90 border-red-400 text-white"
          : "bg-blue-500/90 border-blue-400 text-white"
      }`}
    >
      {type === "success" && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
      {type === "error" && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
      <p className="text-xs md:text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="ml-1 hover:opacity-70 shrink-0">
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
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className={`p-2.5 md:p-3 rounded-full shrink-0 ${
                type === "danger" ? "bg-red-500/20" : "bg-blue-500/20"
              }`}
            >
              {type === "danger" ? (
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              ) : (
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-slate-50">{title}</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3 pt-2">
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
  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "ebooks" | "emails" | "finance" | "templates">("orders");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [templateProducts, setTemplateProducts] = useState<EbookProduct[]>([]);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EbookProduct | null>(null);
  const defaultTemplateForm = {
    name: "",
    description: "",
    price: "",
    discount_price: "",
    discount_percentage: "",
    unit_count: "1",
    file_url: "",
    is_active: true,
  };
  const [templateForm, setTemplateForm] = useState(defaultTemplateForm);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [orders, setOrders] = useState<OrderWithTotal[]>([]);
  const [stockAccounts, setStockAccounts] = useState<StockAccount[]>([]);
  const [ebookProducts, setEbookProducts] = useState<EbookProduct[]>([]);
  const [showAddEbook, setShowAddEbook] = useState(false);
  const [editingEbook, setEditingEbook] = useState<EbookProduct | null>(null);
  const [ebookForm, setEbookForm] = useState({
    name: "",
    description: "",
    price: "",
    unit_count: "1",
    file_url: "",
    is_active: true,
  });
  const [savingEbook, setSavingEbook] = useState(false);
  const [emailProducts, setEmailProducts] = useState<EbookProduct[]>([]);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EbookProduct | null>(null);
  const [emailForm, setEmailForm] = useState({
    name: "",
    description: "",
    price: "",
    unit_count: "1",
    file_url: "",
    is_active: true,
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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

  // ===== LOGIC MAINTENANCE =====
  async function loadMaintenanceStatus() {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "maintenance_mode").single();
    if (data) setMaintenanceMode(data.value);
  }

  async function toggleMaintenance() {
    setLoadingMaintenance(true);
    const newValue = !maintenanceMode;
    const { error } = await supabase.from("app_settings").upsert({ key: 'maintenance_mode', value: newValue });
    
    if (error) {
      showToast("Gagal update maintenance", "error");
    } else {
      setMaintenanceMode(newValue);
      showToast(newValue ? "⛔ Maintenance Mode AKTIF" : "✅ Maintenance Mode MATI", newValue ? "error" : "success");
    }
    setLoadingMaintenance(false);
  }

  // ===== LOGIC TEMPLATES =====
  async function loadTemplates(silent = false) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("product_type", "template")
      .order("created_at", { ascending: false });

    if (error && !silent) showToast("Gagal load templates", "error");
    else if (data) setTemplateProducts(data as EbookProduct[]);
  }

    const handleSaveTemplate = async () => {
      if (!templateForm.name.trim() || !templateForm.price) { 
        showToast("Nama & Harga wajib diisi", "error"); 
        return; 
      }
      
      // Validasi harga diskon
      if (templateForm.discount_price && parseFloat(templateForm.discount_price) >= parseFloat(templateForm.price)) {
        showToast("Harga diskon harus lebih kecil dari harga normal!", "error");
        return;
      }
      
      setSavingTemplate(true);
      const payload = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || null,
        price: parseFloat(templateForm.price),
        discount_price: templateForm.discount_price ? parseFloat(templateForm.discount_price) : null, // ← Tambahkan
        discount_percentage: templateForm.discount_percentage ? parseInt(templateForm.discount_percentage) : null, // ← Tambahkan
        unit_count: parseInt(templateForm.unit_count),
        file_url: templateForm.file_url.trim() || null,
        is_active: templateForm.is_active,
        product_type: "template",
      };

      let error;
      if (editingTemplate) {
        const { error: err } = await supabase.from("products").update(payload).eq("id", editingTemplate.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("products").insert([payload]);
        error = err;
      }

      if (error) showToast("Gagal: " + error.message, "error");
      else {
        showToast("Template berhasil disimpan!", "success");
        setShowAddTemplate(false);
        setTemplateForm({ name: "", description: "", price: "", discount_price: "", discount_percentage: "", unit_count: "1", file_url: "", is_active: true });
        setEditingTemplate(null);
        loadTemplates(true);
      }
      setSavingTemplate(false);
    };

  // ===== AUTH CEK =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = window.localStorage.getItem("ds_admin_auth");
    if (auth !== "yes") {
      router.push("/admin/login");
    }
  }, [router]);

  // Load templates saat tab aktif
  useEffect(() => {
    if (activeTab === "templates") loadTemplates();
  }, [activeTab]);

  // ===== LOAD ORDERS WITH REALTIME =====
  async function loadOrders(silent = false) {
    if (!silent) setLoading(true);
    
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        buyer_email,
        buyer_phone,
        status,
        created_at,
        order_items (
          total_price
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load orders error:", error);
      if (!silent) showToast("Gagal memuat pesanan", "error");
    } else if (data) {
      // Transform data to include total_price
      const transformedOrders: OrderWithTotal[] = data.map((order: any) => ({
        ...order,
        total_price: order.order_items?.reduce(
          (sum: number, item: any) => sum + (item.total_price || 0),
          0
        ) || 0,
      }));
      setOrders(transformedOrders);
      setLastUpdate(new Date());
    }
    
    if (!silent) setLoading(false);
  }

  // Initial load
  useEffect(() => {
    loadOrders();
  }, []);

  // 🔥 REALTIME SUBSCRIPTION untuk orders
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          console.log("🔔 Order changed:", payload);
          
          // Reload data untuk dapetin total_price dari join
          await loadOrders(true);
          
          if (payload.eventType === "INSERT") {
            showToast("📥 Pesanan baru masuk!", "info");
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as any;
            if (updatedOrder.status === "completed") {
              showToast("✅ Pesanan berhasil diproses!", "success");
            }
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Also listen to order_items changes (affects total_price)
    const itemsChannel = supabase
      .channel("order-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          console.log("🔔 Order item changed:", payload);
          await loadOrders(true);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  // 🔥 AUTO POLLING setiap 30 detik (backup jika realtime gagal)
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(true); // silent reload
    }, 30000); // 30 detik

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders(true);
    showToast("🔄 Data berhasil diperbarui!", "success");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // ===== LOAD STOCK WITH REALTIME =====
  async function loadStock(silent = false) {
    const { data, error } = await supabase
      .from("accounts_stock")
      .select("id, username, password, is_used, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load stock error:", error);
      if (!silent) showToast("Gagal memuat stok", "error");
    } else if (data) {
      setStockAccounts(data as StockAccount[]);
      setLastUpdate(new Date());
    }
  }

  useEffect(() => {
    if (activeTab === "stock") {
      loadStock();
    }
  }, [activeTab]);

  // 🔥 REALTIME SUBSCRIPTION untuk stock
  useEffect(() => {
    if (activeTab !== "stock") return;

    const channel = supabase
      .channel("stock-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts_stock",
        },
        (payload) => {
          console.log("🔔 Stock changed:", payload);
          
          if (payload.eventType === "INSERT") {
            const newStock = payload.new as StockAccount;
            setStockAccounts((prev) => [newStock, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedStock = payload.new as StockAccount;
            setStockAccounts((prev) =>
              prev.map((s) => (s.id === updatedStock.id ? updatedStock : s))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setStockAccounts((prev) => prev.filter((s) => s.id !== deletedId));
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ebooks") {
      loadEbooks();
    }
  }, [activeTab]);

    useEffect(() => {
    if (activeTab === "emails") {
      loadEmails();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "ebooks") return;

    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: "product_type=eq.ebook",
        },
        (payload) => {
          console.log("🔔 E-book product changed:", payload);
          
          if (payload.eventType === "INSERT") {
            const newProduct = payload.new as EbookProduct;
            setEbookProducts((prev) => [newProduct, ...prev]);
            showToast("E-book baru ditambahkan!", "success");
          } else if (payload.eventType === "UPDATE") {
            const updatedProduct = payload.new as EbookProduct;
            setEbookProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setEbookProducts((prev) => prev.filter((p) => p.id !== deletedId));
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "emails") return;

    const channel = supabase
      .channel("email-products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: "product_type=eq.gmail",
        },
        (payload) => {
          console.log("🔔 Email product changed:", payload);
          
          if (payload.eventType === "INSERT") {
            const newProduct = payload.new as EbookProduct;
            setEmailProducts((prev) => [newProduct, ...prev]);
            showToast("Email product baru ditambahkan!", "success");
          } else if (payload.eventType === "UPDATE") {
            const updatedProduct = payload.new as EbookProduct;
            setEmailProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setEmailProducts((prev) => prev.filter((p) => p.id !== deletedId));
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        // Data akan auto-update via realtime subscription
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
          // Data akan auto-update via realtime
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
        // Data akan auto-update via realtime
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
          // Data akan auto-update via realtime
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
          // Data akan auto-update via realtime
          setSelectedStockIds([]);
        }
      },
    });
  }

  async function loadEbooks(silent = false) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_type", "ebook")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load ebooks error:", error);
    if (!silent) showToast("Gagal memuat e-book", "error");
  } else if (data) {
    setEbookProducts(data as EbookProduct[]);
    setLastUpdate(new Date());
  }
}

async function loadEmails(silent = false) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_type", "gmail")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load emails error:", error);
    if (!silent) showToast("Gagal memuat email products", "error");
  } else if (data) {
    setEmailProducts(data as EbookProduct[]);
    setLastUpdate(new Date());
  }
}

// Reset form
const resetEbookForm = () => {
  setEbookForm({
    name: "",
    description: "",
    price: "",
    unit_count: "1",
    file_url: "",
    is_active: true,
  });
  setEditingEbook(null);
};

const resetEmailForm = () => {
  setEmailForm({
    name: "",
    description: "",
    price: "",
    unit_count: "1",
    file_url: "",
    is_active: true,
  });
  setEditingEmail(null);
};

// Edit handler
const handleEditEbook = (ebook: EbookProduct) => {
  setEditingEbook(ebook);
  setEbookForm({
    name: ebook.name,
    description: ebook.description || "",
    price: ebook.price.toString(),
    unit_count: ebook.unit_count.toString(),
    file_url: ebook.file_url || "",
    is_active: ebook.is_active,
  });
  setShowAddEbook(true);
};

// Save handler
const handleSaveEbook = async () => {
  if (!ebookForm.name.trim()) {
    showToast("Nama e-book wajib diisi", "error");
    return;
  }
  if (!ebookForm.price || parseFloat(ebookForm.price) <= 0) {
    showToast("Harga harus lebih dari 0", "error");
    return;
  }
  if (!ebookForm.unit_count || parseInt(ebookForm.unit_count) <= 0) {
    showToast("Jumlah unit harus lebih dari 0", "error");
    return;
  }

  setSavingEbook(true);

  try {
    const payload = {
      name: ebookForm.name.trim(),
      description: ebookForm.description.trim() || null,
      price: parseFloat(ebookForm.price),
      unit_count: parseInt(ebookForm.unit_count),
      file_url: ebookForm.file_url.trim() || null,
      is_active: ebookForm.is_active,
      product_type: "ebook",
    };

    if (editingEbook) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingEbook.id);

      if (error) {
        showToast("Gagal update e-book: " + error.message, "error");
      } else {
        showToast("E-book berhasil diupdate! ✨", "success");
        setShowAddEbook(false);
        resetEbookForm();
        await loadEbooks(true)
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert([payload]);

      if (error) {
        showToast("Gagal menambahkan e-book: " + error.message, "error");
      } else {
        showToast("E-book berhasil ditambahkan! 🎉", "success");
        setShowAddEbook(false);
        resetEbookForm();
      }
    }
  } catch (err: any) {
    showToast("Error: " + err.message, "error");
  } finally {
    setSavingEbook(false);
  }
};

// Delete handler
const handleDeleteEbook = (ebook: EbookProduct) => {
  setConfirmModal({
    title: "Hapus E-book?",
    message: `E-book "${ebook.name}" akan dihapus permanen. Yakin ingin melanjutkan?`,
    type: "danger",
    onConfirm: async () => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", ebook.id);

      if (error) {
        showToast("Gagal menghapus e-book: " + error.message, "error");
      } else {
        showToast("E-book berhasil dihapus!", "success");
      }
    },
  });
};

// Toggle status
const toggleEbookStatus = async (ebook: EbookProduct) => {
  const { error } = await supabase
    .from("products")
    .update({ is_active: !ebook.is_active })
    .eq("id", ebook.id);

  if (error) {
    showToast("Gagal mengubah status: " + error.message, "error");
  } else {
    showToast(
      `E-book ${!ebook.is_active ? "diaktifkan" : "dinonaktifkan"}!`,
      "success"
    );
    await loadEbooks(true);
  }
};
const handleEditEmail = (email: EbookProduct) => {
  setEditingEmail(email);
  setEmailForm({
    name: email.name,
    description: email.description || "",
    price: email.price.toString(),
    unit_count: email.unit_count.toString(),
    file_url: email.file_url || "",
    is_active: email.is_active,
  });
  setShowAddEmail(true);
};

const handleSaveEmail = async () => {
  if (!emailForm.name.trim()) {
    showToast("Nama email product wajib diisi", "error");
    return;
  }
  if (!emailForm.price || parseFloat(emailForm.price) <= 0) {
    showToast("Harga harus lebih dari 0", "error");
    return;
  }
  if (!emailForm.unit_count || parseInt(emailForm.unit_count) <= 0) {
    showToast("Jumlah unit harus lebih dari 0", "error");
    return;
  }

  setSavingEmail(true);

  try {
    const payload = {
      name: emailForm.name.trim(),
      description: emailForm.description.trim() || null,
      price: parseFloat(emailForm.price),
      unit_count: parseInt(emailForm.unit_count),
      file_url: emailForm.file_url.trim() || null,
      is_active: emailForm.is_active,
      product_type: "gmail",
    };

    if (editingEmail) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingEmail.id);

      if (error) {
        showToast("Gagal update email product: " + error.message, "error");
      } else {
        showToast("Email product berhasil diupdate! ✨", "success");
        setShowAddEmail(false);
        resetEmailForm();
        await loadEmails(true);
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert([payload]);

      if (error) {
        showToast("Gagal menambahkan email product: " + error.message, "error");
      } else {
        showToast("Email product berhasil ditambahkan! 🎉", "success");
        setShowAddEmail(false);
        resetEmailForm();
        await loadEmails(true);
      }
    }
  } catch (err: any) {
    showToast("Error: " + err.message, "error");
  } finally {
    setSavingEmail(false);
  }
};

const handleDeleteEmail = (email: EbookProduct) => {
  setConfirmModal({
    title: "Hapus Email Product?",
    message: `Email product "${email.name}" akan dihapus permanen. Yakin ingin melanjutkan?`,
    type: "danger",
    onConfirm: async () => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", email.id);

      if (error) {
        showToast("Gagal menghapus email product: " + error.message, "error");
      } else {
        showToast("Email product berhasil dihapus!", "success");
        await loadEmails(true);
      }
    },
  });
};

const toggleEmailStatus = async (email: EbookProduct) => {
  const { error } = await supabase
    .from("products")
    .update({ is_active: !email.is_active })
    .eq("id", email.id);

  if (error) {
    showToast("Gagal mengubah status: " + error.message, "error");
  } else {
    showToast(
      `Email product ${!email.is_active ? "diaktifkan" : "dinonaktifkan"}!`,
      "success"
    );
    await loadEmails(true);
  }
};
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

  const timeAgo = useMemo(() => {
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds} detik lalu`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    return `${hours} jam lalu`;
  }, [lastUpdate]);

  return (
    <main
      className={`${inter.variable} ${poppins.variable} min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 font-sans`}
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

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-12 space-y-6 md:space-y-8">
{/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          
          {/* Bagian Kiri: Judul & Info (JANGAN DIUBAH) */}
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
              {/* ... kode span live, jam, tombol refresh biarkan saja ... */}
              <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 backdrop-blur-sm animate-pulse">
                🟢 Live
              </span>
              <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 md:w-3.5 md:h-3.5 h-3" />
                <span className="hidden sm:inline">{today}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-[10px] md:text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-3 md:w-3.5 md:h-3.5 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{timeAgo}</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight flex items-center gap-2 md:gap-3 bg-linear-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              Dashboard Admin
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3 max-w-2xl leading-relaxed">
              Pantau pesanan realtime, kelola stok, dan analisa keuangan otomatis
            </p>
          </div>

          {/* 👇 PERUBAHAN DI SINI: Bungkus kedua tombol dalam div ini 👇 */}
          <div className="flex items-center gap-3">
            
            {/* Tombol Maintenance */}
            <button
              onClick={toggleMaintenance}
              disabled={loadingMaintenance}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs md:text-sm font-bold transition-all ${
                maintenanceMode 
                  ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20" 
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
              }`}
            >
              {loadingMaintenance ? (
                <span className="animate-spin">⌛</span>
              ) : maintenanceMode ? (
                <><Lock className="w-4 h-4" /> Mode Maintenance</>
              ) : (
                <><Unlock className="w-4 h-4" /> Website Live</>
              )}
            </button>

            {/* Tombol Logout */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("ds_admin_auth");
                }
                router.push("/admin/login");
              }}
              className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-xs md:text-sm font-medium text-slate-200 transition-all bg-slate-900/40 hover:bg-slate-800/60"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Keluar</span>
            </button>

          </div> 
          {/* 👆 AKHIR BUNGKUSAN 👆 */}

        </div>

        {/* Stats Cards - tetap sama seperti kode asli, cuma data sudah realtime */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {/* ... Stats cards sama seperti sebelumnya ... */}
          <div className="group border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-800/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="w-4 h-4 md:w-6 md:h-6 text-slate-300" />
              </div>
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">
              Total Pesanan
            </p>
            <p className="text-2xl md:text-4xl font-bold text-slate-50">
              {loading ? (
                <span className="inline-block h-6 md:h-8 w-16 md:w-20 rounded-lg bg-slate-800 animate-pulse" />
              ) : (
                orders.length
              )}
            </p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-slate-500">
              <span className="hidden md:inline">Semua pesanan masuk</span>
              <span className="md:hidden">Total order</span>
            </p>
          </div>

          <div className="group border border-slate-800 bg-linear-to-br from-amber-900/10 via-slate-900 to-slate-950 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-amber-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-amber-900/50">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4 md:w-6 md:h-6 text-amber-300" />
              </div>
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">
              Pending
            </p>
            <p className="text-2xl md:text-4xl font-bold text-yellow-400">
              {loading ? (
                <span className="inline-block h-6 md:h-8 w-16 md:w-20 rounded-lg bg-slate-800 animate-pulse" />
              ) : (
                pendingOrders
              )}
            </p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-slate-500">
              <span className="hidden md:inline">Menunggu konfirmasi</span>
              <span className="md:hidden">Belum diproses</span>
            </p>
          </div>

          <div className="group border border-slate-800 bg-linear-to-br from-emerald-900/10 via-slate-900 to-slate-950 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-emerald-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-900/50">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DatabaseZap className="w-4 h-4 md:w-6 md:h-6 text-emerald-300" />
              </div>
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">
              Stok Tersedia
            </p>
            <p className="text-2xl md:text-4xl font-bold text-emerald-400">{availableStock}</p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-slate-500">
              <span className="hidden md:inline">Siap dikirim</span>
              <span className="md:hidden">Akun ready</span>
            </p>
          </div>

          <div className="group border border-slate-800 bg-linear-to-br from-emerald-900/30 via-slate-900 to-slate-950 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-900/50">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CircleDollarSign className="w-4 h-4 md:w-6 md:h-6 text-emerald-100" />
              </div>
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-300" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">
              <span className="hidden sm:inline">Total Pendapatan</span>
              <span className="sm:hidden">Pendapatan</span>
            </p>
            <p className="text-lg md:text-4xl font-bold text-emerald-400">
              <span className="hidden md:inline">Rp{" "}</span>
              {totalRevenue.toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-slate-500">
              <span className="hidden md:inline">Akumulasi pesanan selesai</span>
              <span className="md:hidden">Order selesai</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20 rounded-t-xl md:rounded-t-2xl">
          {/* Tambahkan: overflow-x-auto, flex-nowrap, dan hide scrollbar style */}
          <div className="flex gap-2 p-1 overflow-x-auto flex-nowrap no-scrollbar [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "orders"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Pesanan</span>
              <span className="sm:hidden">Order</span>
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-950/30">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "stock"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <DatabaseZap className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Stok Akun</span>
              <span className="sm:hidden">Stok</span>
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-950/30">
                {availableStock}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ebooks")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "ebooks"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">E-Books</span>
              <span className="sm:hidden">E-Book</span>
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-950/30">
                {ebookProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "templates"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 md:w-4 md:h-4" />
              
              {/* Teks Desktop */}
              <span className="hidden sm:inline">Templates</span>
              
              {/* Teks Mobile (agar tidak cuma angka '1') */}
              <span className="sm:hidden">WP</span> 
              
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-950/30">
                {templateProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("emails")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "emails"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Package className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Email Products</span>
              <span className="sm:hidden">Email</span>
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-950/30">
                {emailProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("finance")}
              className={`flex-none shrink-0 px-4 md:px-6 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                activeTab === "finance"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <CircleDollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Keuangan</span>
              <span className="sm:hidden">Rp</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Orders */}
        {activeTab === "orders" && (
          <section className="border border-slate-800 bg-slate-900/80 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950/80 border-b border-slate-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3 flex-wrap">
                    Daftar Pesanan
                    {pendingOrders > 0 && (
                      <span className="text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
                        {pendingOrders} perlu diproses
                      </span>
                    )}
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-1 md:mt-2">
                    <span className="hidden md:inline">Kelola pesanan customer dan kirim akses setelah verifikasi</span>
                    <span className="md:hidden">Proses & kirim pesanan</span>
                  </p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs bg-slate-950/70 border border-slate-800 rounded-lg md:rounded-xl p-1 md:p-1.5">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg transition-all font-medium ${
                      orderFilter === "all"
                        ? "bg-slate-800 text-slate-50 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setOrderFilter("pending")}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg transition-all font-medium ${
                      orderFilter === "pending"
                        ? "bg-amber-500/20 text-amber-100 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg transition-all font-medium ${
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
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari email, nomor WA, atau ID..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg md:rounded-xl pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-lg md:rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-5"
                  >
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                      <div className="h-3 md:h-4 w-32 md:w-48 rounded-lg bg-slate-800" />
                      <div className="h-4 md:h-5 w-16 md:w-24 rounded-full bg-slate-800" />
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <div className="h-2.5 md:h-3 w-24 md:w-32 rounded bg-slate-800" />
                      <div className="h-2.5 md:h-3 w-28 md:w-40 rounded bg-slate-800" />
                      <div className="h-2.5 md:h-3 w-20 md:w-36 rounded bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 md:py-16 space-y-3 md:space-y-4 px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <Search className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-slate-300">
                    {orderSearchQuery ? "Tidak ada hasil pencarian" : "Belum ada pesanan"}
                  </p>
                  <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-md mx-auto">
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
                    className="p-4 md:p-6 flex flex-col gap-3 md:gap-4 hover:bg-slate-950/60 transition-all"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <p className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-xs">
                          {order.buyer_email}
                        </p>
                        <span
                          className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold rounded-full flex items-center gap-1 md:gap-1.5 ${
                            order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : order.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {order.status === "pending" ? (
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          ) : (
                            <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          )}
                          {order.status === "pending"
                            ? "Pending"
                            : order.status === "completed"
                            ? "Selesai"
                            : order.status}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 flex items-center gap-1.5 md:gap-2">
                        <span className="hidden md:inline">WhatsApp:</span>
                        <span className="md:hidden">WA:</span>
                        <span className="font-mono font-medium">
                          {order.buyer_phone || "-"}
                        </span>
                      </p>
                      <p className="text-xs md:text-sm text-emerald-400 font-bold">
                        Rp{" "}
                        {(order.total_price || 0).toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {new Date(order.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-slate-700 rounded-lg md:rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Lihat Detail</span>
                        <span className="sm:hidden">Detail</span>
                      </button>

                      {order.status === "pending" && (
                        <button
                          onClick={() => markPaid(order.id)}
                          disabled={processingId === order.id}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
                        >
                          {processingId === order.id ? (
                            <>
                              <div className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                              <span className="hidden md:inline">Memproses...</span>
                              <span className="md:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="hidden md:inline">Proses & Kirim</span>
                              <span className="md:hidden">Proses</span>
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
          <section className="space-y-4 md:space-y-5">
            <div className="border border-slate-800 bg-slate-900/80 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-5 shadow-xl">
              <div>
                <h2 className="text-lg md:text-2xl font-bold">Manajemen Stok Akun</h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                  {availableStock} tersedia · {usedStock} terpakai
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1.5 md:mt-2 hidden md:block">
                  Pastikan stok selalu cukup sebelum kampanye penjualan
                </p>
              </div>
              <button
                onClick={() => setShowAddStock(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
              >
                <DatabaseZap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Tambah Stok
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari username, password, atau ID..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg md:rounded-xl pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {stockSearchQuery && (
                <button
                  onClick={() => setStockSearchQuery("")}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>

            {/* Bulk actions bar */}
            {selectedStockIds.length > 0 && (
              <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 text-xs md:text-sm shadow-lg">
                <p className="flex items-center gap-1.5 md:gap-2">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <strong>{selectedStockIds.length}</strong> akun dipilih
                </p>
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={bulkDeleteSelectedStock}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-xs md:text-sm font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Hapus Terpilih</span>
                    <span className="md:hidden">Hapus</span>
                  </button>
                  <button
                    onClick={() => setSelectedStockIds([])}
                    className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg border border-amber-400/50 text-xs md:text-sm font-medium hover:bg-amber-500/15 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="border border-slate-800 bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg">Daftar Akun</h3>
                <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 md:gap-2">
                  <Filter className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {filteredStockAccounts.length} dari {stockAccounts.length}
                </span>
              </div>

              {/* Header row - Desktop only */}
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
                  <div className="text-center py-12 md:py-16 space-y-3 md:space-y-4 px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      {stockSearchQuery ? (
                        <Search className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                      ) : (
                        <DatabaseZap className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-300">
                        {stockSearchQuery ? "Tidak ada hasil pencarian" : "Belum ada stok akun"}
                      </p>
                      <p className="text-xs md:text-sm text-slate-500 mt-2">
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
                        className="p-4 md:p-5 flex items-start md:items-center gap-3 md:gap-4 hover:bg-slate-950/60 transition-all"
                      >
                        <div className="shrink-0 pt-0.5 md:pt-0">
                          <input
                            type="checkbox"
                            className="h-4 w-4 md:h-5 md:w-5 rounded border-slate-600 bg-slate-900 cursor-pointer"
                            checked={checked}
                            onChange={() => toggleStockSelection(acc.id)}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                          <div className="flex items-center gap-2 md:gap-3">
                            <p className="text-xs md:text-sm font-bold font-mono truncate text-slate-200">
                              {acc.username}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(acc.username, `user-${acc.id}`)
                              }
                              className="p-1 md:p-1.5 hover:bg-slate-800 rounded-md md:rounded-lg transition-all"
                              title="Copy username"
                            >
                              {copiedId === `user-${acc.id}` ? (
                                <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <p className="text-xs md:text-sm text-slate-500 font-mono truncate">
                              {acc.password}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(acc.password, `pass-${acc.id}`)
                              }
                              className="p-1 md:p-1.5 hover:bg-slate-800 rounded-md md:rounded-lg transition-all"
                              title="Copy password"
                            >
                              {copiedId === `pass-${acc.id}` ? (
                                <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {new Date(acc.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 shrink-0">
                          <span
                            className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1 md:gap-1.5 ${
                              acc.is_used
                                ? "bg-slate-700 text-slate-400"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {acc.is_used ? (
                              <>
                                <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                <span className="hidden md:inline">Terpakai</span>
                                <span className="md:hidden">Used</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                <span className="hidden md:inline">Tersedia</span>
                                <span className="md:hidden">OK</span>
                              </>
                            )}
                          </span>
                          {!acc.is_used && (
                            <button
                              onClick={() => deleteStock(acc.id)}
                              className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded-md md:rounded-lg hover:bg-red-950/30 transition-all"
                            >
                              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              <span className="hidden md:inline">Hapus</span>
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

                {/* 👇 TAMBAHKAN TAB CONTENT E-BOOKS DI SINI */}
        {/* Tab Content: E-books */}
        {activeTab === "ebooks" && (
          <section className="space-y-4 md:space-y-5">
            <div className="border border-slate-800 bg-slate-900/80 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-5 shadow-xl">
              <div>
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  Produk E-Book
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                  {ebookProducts.filter(p => p.is_active).length} aktif · {ebookProducts.filter(p => !p.is_active).length} nonaktif
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1.5 md:mt-2 hidden md:block">
                  Kelola koleksi e-book premium untuk dijual
                </p>
              </div>
              <button
                onClick={() => {
                  resetEbookForm();
                  setShowAddEbook(true);
                }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-purple-500 hover:bg-purple-600 text-xs md:text-sm font-bold transition-all shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Tambah E-book
              </button>
            </div>

            <div className="border border-slate-800 bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg">Daftar E-Book</h3>
                <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 md:gap-2">
                  <BookOpen className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {ebookProducts.length} produk
                </span>
              </div>

              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                {ebookProducts.length === 0 ? (
                  <div className="text-center py-12 md:py-16 space-y-3 md:space-y-4 px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-300">
                        Belum ada produk e-book
                      </p>
                      <p className="text-xs md:text-sm text-slate-500 mt-2">
                        Klik "Tambah E-book" untuk membuat produk baru
                      </p>
                    </div>
                  </div>
                ) : (
                  ebookProducts.map((ebook) => (
                    <div
                      key={ebook.id}
                      className="p-4 md:p-5 hover:bg-slate-950/60 transition-all"
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        {/* Icon */}
                        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm md:text-base font-bold text-slate-100 truncate">
                                {ebook.name}
                              </h4>
                              {ebook.description && (
                                <p className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">
                                  {ebook.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => toggleEbookStatus(ebook)}
                              className={`shrink-0 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full transition-all ${
                                ebook.is_active
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                              }`}
                            >
                              {ebook.is_active ? "Aktif" : "Nonaktif"}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 md:gap-2 text-purple-400">
                              <CircleDollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="font-bold">
                                Rp {ebook.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                              <Package className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span>{ebook.unit_count} unit</span>
                            </div>
                            {ebook.file_url ? (
                              <div className="flex items-center gap-1.5 md:gap-2 text-emerald-400 col-span-2 md:col-span-1">
                                <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <a
                                  href={ebook.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline truncate"
                                >
                                  Link tersedia
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 md:gap-2 text-red-400 col-span-2 md:col-span-1">
                                <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>Belum ada link</span>
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            Dibuat {new Date(ebook.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 md:gap-3 pt-2">
                            <button
                              onClick={() => handleEditEbook(ebook)}
                              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-slate-700 rounded-lg md:rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteEbook(ebook)}
                              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg md:rounded-xl hover:bg-red-950/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
        {/* Tab Content: Templates */}
        {activeTab === "templates" && (
          <section className="space-y-4 md:space-y-5">
            <div className="border border-slate-800 bg-slate-900/80 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-5 shadow-xl">
              <div>
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <LayoutTemplate className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  Produk Templates
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">Kelola tema & plugin WordPress</p>
              </div>
              <button
                onClick={() => {
                  setTemplateForm(defaultTemplateForm);
                  setEditingTemplate(null);
                  setShowAddTemplate(true);
                  setEditingTemplate(null);
                  setShowAddTemplate(true);
                }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Tambah Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateProducts.map((item) => (
                <div key={item.id} className="p-4 border border-slate-800 bg-slate-900 rounded-xl hover:border-blue-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{item.description}</p>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                    <span className="font-bold text-blue-400">Rp {item.price.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingTemplate(item);
                          setTemplateForm({
                            name: item.name,
                            description: item.description || "",
                            price: item.price.toString(),
                            discount_price: item.discount_price ? item.discount_price.toString() : "",          // ✅
                            discount_percentage: item.discount_percentage ? item.discount_percentage.toString() : "", // ✅
                            unit_count: item.unit_count.toString(),
                            file_url: item.file_url || "",
                            is_active: item.is_active,
                          });
                          setShowAddTemplate(true);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg"><Edit className="w-4 h-4 text-slate-300"/>
                      </button>
                      <button 
                        onClick={async () => {
                          if(!confirm("Hapus template ini?")) return;
                          await supabase.from("products").delete().eq("id", item.id);
                          loadTemplates(true);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeTab === "emails" && (
          <section className="space-y-4 md:space-y-5">
            <div className="border border-slate-800 bg-slate-900/80 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-5 shadow-xl">
              <div>
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  Produk Email
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                  {emailProducts.filter(p => p.is_active).length} aktif · {emailProducts.filter(p => !p.is_active).length} nonaktif
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1.5 md:mt-2 hidden md:block">
                  Kelola produk email untuk dijual
                </p>
              </div>
              <button
                onClick={() => {
                  resetEmailForm();
                  setShowAddEmail(true);
                }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-blue-500 hover:bg-blue-600 text-xs md:text-sm font-bold transition-all shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Tambah Email Product
              </button>
            </div>

            <div className="border border-slate-800 bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg">Daftar Email Products</h3>
                <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 md:gap-2">
                  <Package className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {emailProducts.length} produk
                </span>
              </div>

              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                {emailProducts.length === 0 ? (
                  <div className="text-center py-12 md:py-16 space-y-3 md:space-y-4 px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <Package className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-300">
                        Belum ada produk email
                      </p>
                      <p className="text-xs md:text-sm text-slate-500 mt-2">
                        Klik "Tambah Email Product" untuk membuat produk baru
                      </p>
                    </div>
                  </div>
                ) : (
                  emailProducts.map((email) => (
                    <div
                      key={email.id}
                      className="p-4 md:p-5 hover:bg-slate-950/60 transition-all"
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                          <Package className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm md:text-base font-bold text-slate-100 truncate">
                                {email.name}
                              </h4>
                              {email.description && (
                                <p className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">
                                  {email.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => toggleEmailStatus(email)}
                              className={`shrink-0 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full transition-all ${
                                email.is_active
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                              }`}
                            >
                              {email.is_active ? "Aktif" : "Nonaktif"}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 md:gap-2 text-blue-400">
                              <CircleDollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="font-bold">
                                Rp {email.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                              <Package className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span>{email.unit_count} unit</span>
                            </div>
                            {email.file_url ? (
                              <div className="flex items-center gap-1.5 md:gap-2 text-emerald-400 col-span-2 md:col-span-1">
                                <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <a
                                  href={email.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline truncate"
                                >
                                  Link tersedia
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 md:gap-2 text-red-400 col-span-2 md:col-span-1">
                                <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>Belum ada link</span>
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            Dibuat {new Date(email.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>

                          <div className="flex items-center gap-2 md:gap-3 pt-2">
                            <button
                              onClick={() => handleEditEmail(email)}
                              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-slate-700 rounded-lg md:rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(email)}
                              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg md:rounded-xl hover:bg-red-950/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab Content: Finance */}
        {activeTab === "finance" && (
          <section className="space-y-4 md:space-y-5">
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="border border-slate-800 bg-linear-to-br from-emerald-900/10 to-slate-900 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Ringkasan Keuangan
                  </h3>
                  <CircleDollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300">
                      Total Pendapatan
                    </span>
                    <span className="text-base md:text-xl font-bold text-emerald-400">
                      Rp{" "}
                      {totalRevenue.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300">
                      Pesanan Selesai
                    </span>
                    <span className="text-base md:text-xl font-bold text-slate-50">
                      {completedOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300">
                      Rata-rata per Order
                    </span>
                    <span className="text-base md:text-xl font-bold text-slate-50">
                      Rp{" "}
                      {completedOrders > 0
                        ? Math.round(totalRevenue / completedOrders).toLocaleString("id-ID")
                        : "0"}
                    </span>
                  </div>
                </div>
                <p className="mt-4 md:mt-5 text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                  <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Data berdasarkan pesanan dengan status selesai
                </p>
              </div>

              <div className="border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Status Pesanan
                  </h3>
                  <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300 flex items-center gap-1.5 md:gap-2">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
                      Pending
                    </span>
                    <span className="text-base md:text-xl font-bold text-yellow-400">
                      {pendingOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300 flex items-center gap-1.5 md:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                      Selesai
                    </span>
                    <span className="text-base md:text-xl font-bold text-emerald-400">
                      {completedOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-slate-950/50 rounded-lg md:rounded-xl">
                    <span className="text-xs md:text-sm font-medium text-slate-300">Total</span>
                    <span className="text-base md:text-xl font-bold text-slate-50">
                      {orders.length}
                    </span>
                  </div>
                </div>
                <p className="mt-4 md:mt-5 text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 md:gap-2">
                  <Filter className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Gunakan untuk analisa konversi & funnel checkout
                </p>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg">Riwayat Transaksi</h3>
                <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 md:gap-2">
                  <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Menampilkan transaksi selesai</span>
                  <span className="md:hidden">Selesai</span>
                </span>
              </div>
              <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                {orders.filter((o) => o.status === "completed").length === 0 ? (
                  <div className="text-center py-12 md:py-16 space-y-3 md:space-y-4 px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <CircleDollarSign className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-300">
                        Belum ada transaksi selesai
                      </p>
                      <p className="text-xs md:text-sm text-slate-500 mt-2">
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
                        className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-950/60 transition-all"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-bold truncate">
                            {order.buyer_email}
                          </p>
                          <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 md:gap-2">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {new Date(order.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm md:text-base font-bold text-emerald-400 flex items-center gap-1.5 md:gap-2 justify-end">
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />+ Rp{" "}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl max-w-3xl w-full shadow-2xl animate-in zoom-in duration-200 my-4">
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-4 md:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <DatabaseZap className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                  Tambah Stok Akun
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2">
                  Tambahkan akun baru ke database
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
                className="p-2 md:p-2.5 hover:bg-slate-800 rounded-lg md:rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="border-b border-slate-800 p-4 md:p-5">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  onClick={() => setBulkMode(false)}
                  className={`px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all ${
                    !bulkMode
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Tambah 1 Akun
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all ${
                    bulkMode
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Bulk Import
                </button>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 flex items-center gap-1.5 md:gap-2">
                <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">Gunakan mode bulk untuk memasukkan banyak akun sekaligus</span>
                <span className="md:hidden">Bulk untuk banyak akun sekaligus</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
              {!bulkMode ? (
                <div className="space-y-4 md:space-y-5">
                  <div>
                    <label className="text-xs md:text-sm font-bold text-slate-300 flex mb-2 md:mb-2.5 flex items-center gap-2">
                      <span>Username / Email</span>
                    </label>
                    <input
                      type="text"
                      value={singleUsername}
                      onChange={(e) => setSingleUsername(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                      Password
                    </label>
                    <input
                      type="text"
                      value={singlePassword}
                      onChange={(e) => setSinglePassword(e.target.value)}
                      placeholder="password123"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-blue-300 mb-1">
                        Tips Keamanan
                      </p>
                      <p className="text-[10px] md:text-xs text-blue-300/80">
                        Gunakan password yang unik untuk setiap akun
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  <label className="text-xs md:text-sm font-bold text-slate-300 block">
                    Data Akun (Bulk Import)
                  </label>

                  <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    {/* Format Guide - Stacked on mobile */}
                    <div className="md:w-72 md:shrink-0 bg-slate-950/60 border border-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 space-y-2 md:space-y-3">
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
                          <Filter className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Format yang Digunakan
                        </p>
                        <code className="text-xs md:text-sm text-emerald-400 font-mono bg-slate-900 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg block">
                          username|password
                        </code>
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-slate-500 mb-1.5 md:mb-2">
                          Contoh Format:
                        </p>
                        <pre className="text-[10px] md:text-xs text-slate-400 font-mono bg-slate-900 p-2 md:p-3 rounded-md md:rounded-lg whitespace-pre-wrap">
                          akun1@gmail.com|password123{"\n"}akun2@gmail.com|pass456{"\n"}user3|mypassword
                        </pre>
                      </div>
                      <div className="bg-amber-950/30 border border-amber-900/50 rounded-md md:rounded-lg p-2 md:p-3">
                        <p className="text-[10px] md:text-xs text-amber-300 flex items-center gap-1.5 md:gap-2">
                          <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Satu akun per baris
                        </p>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1">
                      <textarea
                        value={bulkStockText}
                        onChange={(e) => setBulkStockText(e.target.value)}
                        placeholder="contoh@gmail.com|password123&#10;akun2@gmail.com|pass456"
                        className="w-full h-48 md:h-[380px] bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono resize-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] md:text-xs text-blue-300">
                      <strong>Tip:</strong> Gunakan pemisah{" "}
                      <code className="bg-slate-900 px-1.5 md:px-2 py-0.5 rounded">|</code>{" "}
                      (pipe) antara username dan password
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-4 md:p-6 flex items-center justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setSingleUsername("");
                  setSinglePassword("");
                  setBulkStockText("");
                  setBulkMode(false);
                }}
                disabled={addingStock}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 text-xs md:text-sm font-medium transition-all disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 md:gap-2 px-5 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
              >
                {addingStock ? (
                  <>
                    <div className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    <span className="hidden md:inline">Menyimpan...</span>
                    <span className="md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {bulkMode ? "Simpan Semua" : "Simpan Akun"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit E-book */}
      {showAddEbook && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in duration-200 my-4">
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-4 md:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  {editingEbook ? "Edit E-book" : "Tambah E-book Baru"}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2">
                  {editingEbook ? "Update informasi e-book" : "Tambahkan e-book premium ke katalog"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddEbook(false);
                  resetEbookForm();
                }}
                className="p-2 md:p-2.5 hover:bg-slate-800 rounded-lg md:rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Nama E-book */}
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                  Nama E-book <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ebookForm.name}
                  onChange={(e) => setEbookForm({ ...ebookForm, name: e.target.value })}
                  placeholder="Contoh: Panduan Instagram Marketing 2024"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                  Deskripsi
                </label>
                <textarea
                  value={ebookForm.description}
                  onChange={(e) => setEbookForm({ ...ebookForm, description: e.target.value })}
                  placeholder="Deskripsikan konten e-book secara singkat..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                />
              </div>

              {/* Harga & Unit Count */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                    Harga (Rp) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={ebookForm.price}
                    onChange={(e) => setEbookForm({ ...ebookForm, price: e.target.value })}
                    placeholder="50000"
                    min="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                    Jumlah Unit <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={ebookForm.unit_count}
                    onChange={(e) => setEbookForm({ ...ebookForm, unit_count: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1.5">
                    Untuk bundle e-book
                  </p>
                </div>
              </div>

              {/* File URL */}
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 flex mb-2 md:mb-2.5 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Link Google Drive
                </label>
                <input
                  type="url"
                  value={ebookForm.file_url}
                  onChange={(e) => setEbookForm({ ...ebookForm, file_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/xxx/view?usp=sharing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-[10px] md:text-xs text-slate-500 mt-1.5">
                  Link download akan dikirim ke customer via WhatsApp
                </p>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-3 p-3 md:p-4 bg-slate-950/60 rounded-lg md:rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="ebook-active"
                  checked={ebookForm.is_active}
                  onChange={(e) => setEbookForm({ ...ebookForm, is_active: e.target.checked })}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-600 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="ebook-active" className="text-xs md:text-sm font-medium text-slate-300 cursor-pointer flex-1">
                  Aktifkan produk (tampil di halaman customer)
                </label>
              </div>

              {/* Info */}
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs md:text-sm font-semibold text-blue-300 mb-1">
                    Tips
                  </p>
                  <ul className="text-[10px] md:text-xs text-blue-300/80 space-y-1">
                    <li>• Pastikan link Google Drive sudah di-set ke "Anyone with the link"</li>
                    <li>• Gunakan deskripsi yang menarik untuk meningkatkan konversi</li>
                    <li>• Unit count untuk bundle (misal: 3 e-book dalam 1 paket)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-4 md:p-6 flex items-center justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowAddEbook(false);
                  resetEbookForm();
                }}
                disabled={savingEbook}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 text-xs md:text-sm font-medium transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEbook}
                disabled={savingEbook || !ebookForm.name.trim() || !ebookForm.price}
                className="inline-flex items-center gap-1.5 md:gap-2 px-5 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-purple-500 hover:bg-purple-600 text-xs md:text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
              >
                {savingEbook ? (
                  <>
                    <div className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    <span className="hidden md:inline">Menyimpan...</span>
                    <span className="md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {editingEbook ? "Update E-book" : "Simpan E-book"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
            {/* 👇 TAMBAHKAN MODAL EMAIL DI SINI, SEBELUM </main> */}
      {showAddEmail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in duration-200 my-4">
            <div className="border-b border-slate-800 p-4 md:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  {editingEmail ? "Edit Gmail Product" : "Tambah Gmail Product Baru"}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5 md:mt-2">
                  {editingEmail ? "Update informasi gmail product" : "Tambahkan gmail product ke katalog"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddEmail(false);
                  resetEmailForm();
                }}
                className="p-2 md:p-2.5 hover:bg-slate-800 rounded-lg md:rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                  Nama Gmail Product <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                  placeholder="Contoh: Akun Gmail Aged PVA 2020"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                  Deskripsi
                </label>
                <textarea
                  value={emailForm.description}
                  onChange={(e) => setEmailForm({ ...emailForm, description: e.target.value })}
                  placeholder="Deskripsikan konten gmail product secara singkat..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                    Harga (Rp) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={emailForm.price}
                    onChange={(e) => setEmailForm({ ...emailForm, price: e.target.value })}
                    placeholder="50000"
                    min="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5">
                    Jumlah Akun <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={emailForm.unit_count}
                    onChange={(e) => setEmailForm({ ...emailForm, unit_count: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1.5">
                    Per order customer dapat berapa akun
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-bold text-slate-300 block mb-2 md:mb-2.5 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Link File (Opsional)
                </label>
                <input
                  type="url"
                  value={emailForm.file_url}
                  onChange={(e) => setEmailForm({ ...emailForm, file_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/xxx/view?usp=sharing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-[10px] md:text-xs text-slate-500 mt-1.5">
                  Link tambahan akan dikirim ke customer via WhatsApp
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 md:p-4 bg-slate-950/60 rounded-lg md:rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="email-active"
                  checked={emailForm.is_active}
                  onChange={(e) => setEmailForm({ ...emailForm, is_active: e.target.checked })}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-600 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="email-active" className="text-xs md:text-sm font-medium text-slate-300 cursor-pointer flex-1">
                  Aktifkan produk (tampil di halaman customer)
                </label>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs md:text-sm font-semibold text-blue-300 mb-1">
                    Tips
                  </p>
                  <ul className="text-[10px] md:text-xs text-blue-300/80 space-y-1">
                    <li>• Pastikan stok akun gmail tersedia di menu Stok Akun</li>
                    <li>• Gunakan deskripsi yang jelas tentang kualitas akun</li>
                    <li>• Unit count = jumlah akun yang diterima customer per order</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 p-4 md:p-6 flex items-center justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowAddEmail(false);
                  resetEmailForm();
                }}
                disabled={savingEmail}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 text-xs md:text-sm font-medium transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={savingEmail || !emailForm.name.trim() || !emailForm.price}
                className="inline-flex items-center gap-1.5 md:gap-2 px-5 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-blue-500 hover:bg-blue-600 text-xs md:text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
              >
                {savingEmail ? (
                  <>
                    <div className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    <span className="hidden md:inline">Menyimpan...</span>
                    <span className="md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {editingEmail ? "Update Gmail Product" : "Simpan Gmail Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        {/* Modal Add/Edit Template */}
        {showAddTemplate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl animate-in zoom-in my-4">
              {/* Header */}
              <div className="border-b border-slate-800 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <LayoutTemplate className="w-6 h-6 text-blue-400" />
                    {editingTemplate ? "Edit Template" : "Tambah Template Baru"}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">
                    {editingTemplate ? "Update informasi template" : "Tambahkan template premium ke katalog"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddTemplate(false);
                    setTemplateForm({ name: "", description: "", price: "", discount_price: "", discount_percentage: "", unit_count: "1", file_url: "", is_active: true });
                    setEditingTemplate(null);
                  }}
                  className="p-2.5 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Nama Template */}
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-2.5">
                    Nama Template <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Contoh: Tema E-Commerce Modern"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-2.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Deskripsikan template secara singkat..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                {/* 🔥 HARGA & DISKON - ENHANCED */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Harga Normal */}
                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-2.5">
                      Harga Normal (Rp) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={templateForm.price}
                      onChange={(e) => {
                        const newPrice = e.target.value;
                        setTemplateForm({ ...templateForm, price: newPrice });
                        
                        // Auto-calculate discount percentage if discount_price exists
                        if (templateForm.discount_price && parseFloat(newPrice) > 0) {
                          const discountPercent = Math.round(
                            ((parseFloat(newPrice) - parseFloat(templateForm.discount_price)) / parseFloat(newPrice)) * 100
                          );
                          setTemplateForm(prev => ({ ...prev, discount_percentage: discountPercent.toString() }));
                        }
                      }}
                      placeholder="150000"
                      min="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  {/* Harga Diskon */}
                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-2.5 flex items-center gap-2">
                      Harga Diskon (Rp)
                      <span className="text-xs text-slate-500 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      value={templateForm.discount_price}
                      onChange={(e) => {
                        const newDiscountPrice = e.target.value;
                        setTemplateForm({ ...templateForm, discount_price: newDiscountPrice });
                        
                        // Auto-calculate discount percentage
                        if (newDiscountPrice && templateForm.price && parseFloat(templateForm.price) > 0) {
                          const discountPercent = Math.round(
                            ((parseFloat(templateForm.price) - parseFloat(newDiscountPrice)) / parseFloat(templateForm.price)) * 100
                          );
                          setTemplateForm(prev => ({ ...prev, discount_percentage: discountPercent.toString() }));
                        }
                      }}
                      placeholder="100000"
                      min="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Persentase Diskon (Auto-calculated) */}
                {templateForm.discount_price && templateForm.price && parseFloat(templateForm.price) > 0 && (
                  <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 flex items-center gap-3">
                    <Tag className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-300">
                        Diskon Otomatis Terhitung
                      </p>
                      <p className="text-xs text-emerald-400/80 mt-1">
                        Pelanggan hemat{" "}
                        <span className="font-bold">
                          {templateForm.discount_percentage}%
                        </span>
                        {" "}atau{" "}
                        <span className="font-bold">
                          Rp {(parseFloat(templateForm.price) - parseFloat(templateForm.discount_price)).toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Unit Count */}
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-2.5">
                    Jumlah Unit <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={templateForm.unit_count}
                    onChange={(e) => setTemplateForm({ ...templateForm, unit_count: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Untuk bundle template
                  </p>
                </div>

                {/* File URL */}
                <div>
                  <label className="text-sm font-bold text-slate-300 flex mb-2.5 items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Link Google Drive
                  </label>
                  <input
                    type="url"
                    value={templateForm.file_url}
                    onChange={(e) => setTemplateForm({ ...templateForm, file_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/xxx/view?usp=sharing"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Link download akan dikirim ke customer via WhatsApp
                  </p>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-900 cursor-pointer"
                  />
                  <label htmlFor="template-active" className="text-sm font-medium text-slate-300 cursor-pointer flex-1">
                    Aktifkan produk (tampil di halaman customer)
                  </label>
                </div>

                {/* Info Tips */}
                <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300 mb-1">
                      Tips Diskon
                    </p>
                    <ul className="text-xs text-blue-300/80 space-y-1">
                      <li>• Kosongkan "Harga Diskon" jika tidak ingin memberikan diskon</li>
                      <li>• Persentase diskon akan dihitung otomatis</li>
                      <li>• Harga diskon harus lebih kecil dari harga normal</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-800 p-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddTemplate(false);
                    setTemplateForm({ name: "", description: "", price: "", discount_price: "", discount_percentage: "", unit_count: "1", file_url: "", is_active: true });
                    setEditingTemplate(null);
                  }}
                  disabled={savingTemplate}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !templateForm.name.trim() || !templateForm.price}
                  className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-bold disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                >
                  {savingTemplate ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingTemplate ? "Update Template" : "Simpan Template"}
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