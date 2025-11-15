"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // Pastikan lucide-react terinstall

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (
  email === process.env.NEXT_PUBLIC_ADMIN_USERNAMER && 
  password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        if (typeof window !== "undefined") {
          localStorage.setItem("ds_admin_auth", "yes");
        }
        router.push("/admin/dashboard");
      } else {
        setError("Username atau password salah");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Masuk</h1>
          <p className="text-sm text-slate-400">
            Masukkan kredensial untuk melanjutkan
          </p>
        </div>

        {/* Form Card */}
        <div className="border border-slate-800 bg-slate-900/50 backdrop-blur rounded-xl p-6 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">
                Username
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-lg px-4 py-3 text-sm transition-all outline-none placeholder:text-slate-500"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan username"
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            {/* Password Field with Eye Icon */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-lg px-4 py-3 pr-12 text-sm transition-all outline-none placeholder:text-slate-500"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 py-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-900/30 text-sm font-medium text-slate-300 transition-all text-center"
              >
                Kembali
              </Link>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Login dengan E-mail & Password yang sesuai.
          </p>
        </div>
      </div>
    </main>
  );
}