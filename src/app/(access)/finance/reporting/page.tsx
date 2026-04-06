"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/api";
import type { Database } from "@/types/database.types";

type Transaction = Database["public"]["Views"]["cashflow_transactions_view"]["Row"];
type Category = Database["public"]["Tables"]["cashflow_categories"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["cashflow_transactions"]["Insert"];

const TYPES = [
  { value: "income", label: "Pemasukan", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { value: "expense", label: "Pengeluaran", color: "text-red-500", bg: "bg-red-50 border-red-200" },
];

function formatRupiah(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(Number(num));
}
function parseRupiah(value: string): number {
  return Number(value.replace(/\D/g, ""));
}
function displayRupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

const EMPTY_FORM = {
  type: "income",
  description: "",
  amount: "",
  category_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  notes: "",
  reference_no: "",
};

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const PER_PAGE = 15;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, filterType, filterMonth, search]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadCategories() {
    const { data } = await supabase.from("cashflow_categories").select("*").order("name");
    if (data) setCategories(data);
  }

  async function loadTransactions() {
    let q = supabase
      .from("cashflow_transactions_view")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filterType !== "all") q = q.eq("type", filterType);
    if (filterMonth) {
      const start = filterMonth + "-01";
      const end = filterMonth + "-31";
      q = q.gte("transaction_date", start).lte("transaction_date", end);
    }
    if (search) q = q.ilike("description", `%${search}%`);

    q = q.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const { data, count } = await q;
    if (data) {
      setTransactions(data);
      setTotal(count ?? 0);
    }

    // Summary for filtered month
    let sq = supabase
      .from("cashflow_transactions_view")
      .select("type, amount");
    if (filterMonth) {
      sq = sq.gte("transaction_date", filterMonth + "-01").lte("transaction_date", filterMonth + "-31");
    }
    const { data: sData } = await sq;
    if (sData) {
      const income = sData.filter((r) => r.type === "income").reduce((s, r) => s + (r.amount ?? 0), 0);
      const expense = sData.filter((r) => r.type === "expense").reduce((s, r) => s + (r.amount ?? 0), 0);
      setSummary({ income, expense });
    }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(t: Transaction) {
    setForm({
      type: t.type ?? "income",
      description: t.description ?? "",
      amount: formatRupiah(String(t.amount ?? 0)),
      category_id: t.category_id ?? "",
      transaction_date: t.transaction_date ?? new Date().toISOString().split("T")[0],
      notes: t.notes ?? "",
      reference_no: t.reference_no ?? "",
    });
    setEditId(t.id ?? null);
    setShowModal(true);
  }

  async function handleSave() {
    const amount = parseRupiah(form.amount);
    if (!form.description.trim()) return showToast("Deskripsi wajib diisi.", "error");
    if (!amount) return showToast("Jumlah wajib diisi.", "error");

    setLoading(true);
    const payload: TransactionInsert = {
      type: form.type,
      description: form.description,
      amount,
      category_id: form.category_id || null,
      transaction_date: form.transaction_date,
      notes: form.notes || null,
      reference_no: form.reference_no || null,
    };

    if (editId) {
      const { error } = await supabase
        .from("cashflow_transactions")
        .update(payload)
        .eq("id", editId);
      if (error) showToast("Gagal update: " + error.message, "error");
      else showToast("Transaksi berhasil diupdate!");
    } else {
      const { error } = await supabase.from("cashflow_transactions").insert(payload);
      if (error) showToast("Gagal simpan: " + error.message, "error");
      else showToast("Transaksi berhasil ditambahkan!");
    }

    setLoading(false);
    setShowModal(false);
    loadTransactions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeleting(id);
    await supabase.from("cashflow_transactions").delete().eq("id", id);
    setDeleting(null);
    showToast("Transaksi dihapus.");
    loadTransactions();
  }

  const filteredCats = categories.filter((c) => c.type === form.type);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Arus Kas</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kelola pemasukan & pengeluaran gereja</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm px-4 py-2.5 rounded-xl transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-400/30"
        >
          <span className="text-base">＋</span> Tambah Transaksi
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pemasukan", value: summary.income, color: "text-emerald-600", icon: "↑", bg: "bg-emerald-50 text-emerald-600" },
            { label: "Pengeluaran", value: summary.expense, color: "text-red-500", icon: "↓", bg: "bg-red-50 text-red-500" },
            { label: "Saldo Bersih", value: summary.income - summary.expense, color: summary.income - summary.expense >= 0 ? "text-slate-800" : "text-red-500", icon: "≈", bg: "bg-slate-100 text-slate-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold ${s.bg}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{displayRupiah(s.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 transition"
          />
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${
                  filterType === t
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t === "all" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Cari deskripsi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Tanggal</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Deskripsi</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Tipe</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Jumlah</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition group">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {t.transaction_date
                        ? new Date(t.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{t.description}</p>
                      {t.reference_no && (
                        <p className="text-xs text-slate-400 mt-0.5">Ref: {t.reference_no}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.category_name ? (
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                          {t.category_name}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          t.type === "income"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}
                      >
                        {t.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${
                      t.type === "income" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {t.type === "expense" ? "−" : "+"}{displayRupiah(t.amount ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id!)}
                          disabled={deleting === t.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 012-2h4a2 2 0 012 2M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                {total} transaksi · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">
                {editId ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipe */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Tipe</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.value, category_id: "" }))}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition ${
                        form.type === t.value
                          ? t.value === "income"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-red-500 border-red-500 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Deskripsi *</label>
                <input
                  type="text"
                  placeholder="Nama transaksi..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Jumlah *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: formatRupiah(e.target.value) }))}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* 2-col row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Kategori</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
                  >
                    <option value="">— Pilih —</option>
                    {filteredCats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Referensi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">No. Referensi</label>
                <input
                  type="text"
                  placeholder="Opsional..."
                  value={form.reference_no}
                  onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:bg-white transition resize-none"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : null}
                {editId ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}