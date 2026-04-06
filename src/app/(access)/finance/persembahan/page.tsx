"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/api";
import type { Database } from "@/types/database.types";

type Jemaat = Database["public"]["Tables"]["jemaat"]["Row"];
type OfferingInsert = Database["public"]["Tables"]["offerings"]["Insert"];

const OFFERING_TYPES = [
  { value: "persembahan_umum", label: "Persembahan Umum" },
  { value: "persembahan_perpuluhan", label: "Perpuluhan" },
  { value: "persembahan_misi", label: "Persembahan Misi" },
  { value: "persembahan_bangunan", label: "Persembahan Bangunan" },
  { value: "persembahan_khusus", label: "Persembahan Khusus" },
  { value: "persembahan_anak", label: "Persembahan Anak" },
];

const PAYMENT_METHODS = [
  { value: "tunai", label: "Tunai", icon: "💵" },
  { value: "transfer", label: "Transfer Bank", icon: "🏦" },
  { value: "qris", label: "QRIS", icon: "📱" },
];

function formatRupiah(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(Number(num));
}

function parseRupiah(value: string): number {
  return Number(value.replace(/\D/g, ""));
}

interface FormState {
  jemaat_id: string;
  jemaat_search: string;
  offering_type: string;
  payment_method: string;
  amount: string;
  transaction_date: string;
  is_anonymous: boolean;
}

export default function PersembahanPage() {
  const [form, setForm] = useState<FormState>({
    jemaat_id: "",
    jemaat_search: "",
    offering_type: "persembahan_umum",
    payment_method: "tunai",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    is_anonymous: false,
  });

  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [filteredJemaat, setFilteredJemaat] = useState<Jemaat[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOfferings, setRecentOfferings] = useState<any[]>([]);
  const [totalToday, setTotalToday] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadJemaat() {
      const { data } = await supabase
        .from("jemaat")
        .select("id, nama_lengkap, status_jemaat")
        .eq("status_jemaat", "aktif")
        .order("nama_lengkap");
      if (data) setJemaatList(data as Jemaat[]);
    }
    loadJemaat();
    loadRecentOfferings();
  }, []);

  async function loadRecentOfferings() {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("offerings")
      .select("*, jemaat(nama_lengkap)")
      .eq("transaction_date", today)
      .order("id", { ascending: false })
      .limit(10);

    if (data) {
      setRecentOfferings(data);
      const total = data.reduce((sum, o) => sum + (o.amount || 0), 0);
      setTotalToday(total);
    }
  }

  useEffect(() => {
    if (!form.jemaat_search || form.is_anonymous) {
      setFilteredJemaat([]);
      setShowDropdown(false);
      return;
    }
    const q = form.jemaat_search.toLowerCase();
    const filtered = jemaatList.filter((j) =>
      j.nama_lengkap.toLowerCase().includes(q)
    );
    setFilteredJemaat(filtered.slice(0, 8));
    setShowDropdown(filtered.length > 0);
  }, [form.jemaat_search, jemaatList, form.is_anonymous]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectJemaat(j: Jemaat) {
    setForm((f) => ({ ...f, jemaat_id: j.id, jemaat_search: j.nama_lengkap }));
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseRupiah(form.amount);
    if (!amount || amount <= 0) {
      setError("Jumlah persembahan harus diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: OfferingInsert = {
      amount,
      offering_type: form.offering_type,
      payment_method: form.payment_method,
      transaction_date: form.transaction_date,
      jemaat_id: form.is_anonymous || !form.jemaat_id ? null : form.jemaat_id,
    };

    const { error: err } = await supabase.from("offerings").insert(payload);
    setLoading(false);

    if (err) {
      setError("Gagal menyimpan data: " + err.message);
    } else {
      setSuccess(true);
      setForm((f) => ({
        ...f,
        jemaat_id: "",
        jemaat_search: "",
        amount: "",
        is_anonymous: false,
      }));
      await loadRecentOfferings();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Persembahan Super Sunday
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Input & rekam persembahan jemaat
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-2.5 text-right">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Total Hari Ini
          </p>
          <p className="text-xl font-bold text-amber-400 mt-0.5">
            Rp {new Intl.NumberFormat("id-ID").format(totalToday)}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── Form Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
              🙏
            </div>
            <span className="font-semibold text-slate-800">
              Input Persembahan
            </span>
          </div>

          <div className="p-6">
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl px-4 py-3 mb-5">
                ✅ Persembahan berhasil dicatat!
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-5">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      transaction_date: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:bg-white transition"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Jumlah Persembahan
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        amount: formatRupiah(e.target.value),
                      }))
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-2xl font-bold text-slate-800 tracking-tight focus:outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Jenis Persembahan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Jenis Persembahan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OFFERING_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, offering_type: t.value }))
                      }
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition ${
                        form.offering_type === t.value
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, payment_method: m.value }))
                      }
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition ${
                        form.payment_method === m.value
                          ? "bg-slate-100 border-slate-700 text-slate-800"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400"
                      }`}
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama Pemberi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Nama Pemberi
                </label>

                {/* Anonymous toggle */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl cursor-pointer select-none mb-2.5"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      is_anonymous: !f.is_anonymous,
                      jemaat_id: "",
                      jemaat_search: "",
                    }))
                  }
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                      form.is_anonymous
                        ? "bg-slate-800 border-slate-800"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {form.is_anonymous && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">
                    Persembahan anonim
                  </span>
                </div>

                {/* Jemaat search dropdown */}
                {!form.is_anonymous && (
                  <div ref={dropdownRef} className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama jemaat..."
                      autoComplete="off"
                      value={form.jemaat_search}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          jemaat_search: e.target.value,
                          jemaat_id: "",
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:bg-white transition"
                    />
                    {showDropdown && (
                      <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
                        {filteredJemaat.map((j) => (
                          <div
                            key={j.id}
                            onMouseDown={() => selectJemaat(j)}
                            className="px-4 py-2.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
                          >
                            {j.nama_lengkap}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-800/20 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>💾 Simpan Persembahan</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Recent Offerings Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
              📋
            </div>
            <span className="font-semibold text-slate-800">
              Masuk Hari Ini
            </span>
          </div>

          <div className="px-6 py-2 divide-y divide-slate-100">
            {recentOfferings.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">
                Belum ada persembahan hari ini
              </p>
            ) : (
              recentOfferings.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-3">
                  <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {(o.jemaat as any)?.nama_lengkap ?? "Anonim"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {OFFERING_TYPES.find((t) => t.value === o.offering_type)
                        ?.label ?? o.offering_type}{" "}
                      · {o.payment_method}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                    Rp {new Intl.NumberFormat("id-ID").format(o.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}