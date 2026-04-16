"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/api";
import type { Database } from "@/types/database.types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [chartData, setChartData] = useState<Array<{ month: string; income: number; expense: number; net: number }>>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSource, setFormSource] = useState<"cashflow" | "offering">("cashflow");

  const PER_PAGE = 15;

  useEffect(() => {
    loadCategories();
    loadChartData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, filterType, filterMonth, search]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from("cashflow_categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  }

  async function loadChartData() {
    const monthsData: Array<{ month: string; income: number; expense: number; net: number }> = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const start = monthStr + "-01";
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data: cfData } = await supabase
        .from("cashflow_transactions_view")
        .select("type, amount")
        .gte("transaction_date", start)
        .lte("transaction_date", end);

      const { data: offeringData } = await supabase
        .from("offerings")
        .select("amount")
        .gte("transaction_date", start)
        .lte("transaction_date", end);

      const cfIncome = (cfData ?? [])
        .filter((r) => r.type === "income")
        .reduce((s, r) => s + (r.amount ?? 0), 0);
      const cfExpense = (cfData ?? [])
        .filter((r) => r.type === "expense")
        .reduce((s, r) => s + (r.amount ?? 0), 0);
      const offeringIncome = (offeringData ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);

      const totalIncome = cfIncome + offeringIncome;
      const monthLabel = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString("id-ID", {
        month: "short",
      });

      monthsData.push({
        month: monthLabel,
        income: totalIncome,
        expense: cfExpense,
        net: totalIncome - cfExpense,
      });
    }

    setChartData(monthsData);
  }

  async function loadTransactions() {
    let q = supabase
      .from("cashflow_transactions_view")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filterMonth) {
      const start = filterMonth + "-01";
      const end = filterMonth + "-31";
      q = q.gte("transaction_date", start).lte("transaction_date", end);
    }

    const { data: cashflowData } = await q;

    const { data: offeringsData } = await supabase
      .from("offerings")
      .select("*");

    let filteredOfferings = offeringsData ?? [];
    if (filterMonth) {
      const start = filterMonth + "-01";
      const end = filterMonth + "-31";
      filteredOfferings = filteredOfferings.filter((o) => {
        const date = o.transaction_date;
        return date && date >= start && date <= end;
      });
    }

    const transformedOfferings: Transaction[] = filteredOfferings.map((o) => ({
      id: o.id,
      type: "income",
      description: o.offering_type ? `Persembahan: ${o.offering_type}` : "Persembahan",
      amount: o.amount,
      category_id: null,
      category_name: "Persembahan",
      transaction_date: o.transaction_date,
      notes: o.payment_method ? `Metode: ${o.payment_method}` : null,
      reference_no: null,
      created_at: null,
      updated_at: null,
    }));

    let allTransactions = [...(cashflowData ?? []), ...transformedOfferings];

    if (filterType !== "all") {
      allTransactions = allTransactions.filter((t) => t.type === filterType);
    }

    if (search) {
      allTransactions = allTransactions.filter((t) =>
        t.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    allTransactions.sort((a, b) => {
      const dateA = new Date(a.transaction_date ?? 0).getTime();
      const dateB = new Date(b.transaction_date ?? 0).getTime();
      return dateB - dateA;
    });

    // Paginate
    const total = allTransactions.length;
    const paginatedData = allTransactions.slice(
      (page - 1) * PER_PAGE,
      page * PER_PAGE
    );

    setTransactions(paginatedData);
    setTotal(total);

    // Summary for filtered month
    let sq = supabase
      .from("cashflow_transactions_view")
      .select("type, amount");
    if (filterMonth) {
      sq = sq.gte("transaction_date", filterMonth + "-01").lte("transaction_date", filterMonth + "-31");
    }
    const { data: sData } = await sq;

    let summaryIncome = (sData ?? []).filter((r) => r.type === "income").reduce((s, r) => s + (r.amount ?? 0), 0);
    const expense = (sData ?? []).filter((r) => r.type === "expense").reduce((s, r) => s + (r.amount ?? 0), 0);

    // Add offerings to income summary - filtered by month
    let offeringsForSummary = offeringsData ?? [];
    if (filterMonth) {
      const start = filterMonth + "-01";
      const end = filterMonth + "-31";
      offeringsForSummary = offeringsForSummary.filter((o) => {
        const date = o.transaction_date;
        return date && date >= start && date <= end;
      });
    }
    const offeringsTotal = offeringsForSummary.reduce((s, o) => s + (o.amount ?? 0), 0);
    summaryIncome += offeringsTotal;

    setSummary({ income: summaryIncome, expense });
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setFormSource("cashflow");
    setShowAddForm(true);
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

    if (formSource === "offering") {
      // Save to offerings table
      if (editId) {
        const { error } = await supabase
          .from("offerings")
          .update({
            amount,
            offering_type: form.description,
            transaction_date: form.transaction_date,
            payment_method: form.notes || null,
          })
          .eq("id", editId);
        if (error) showToast("Gagal update: " + error.message, "error");
        else showToast("Persembahan berhasil diupdate!");
      } else {
        const { error } = await supabase.from("offerings").insert({
          amount,
          offering_type: form.description,
          transaction_date: form.transaction_date,
          payment_method: form.notes || null,
        });
        if (error) showToast("Gagal simpan: " + error.message, "error");
        else showToast("Persembahan berhasil ditambahkan!");
      }
    } else {
      // Save to cashflow_transactions table
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
    }

    setLoading(false);
    setShowAddForm(false);
    loadTransactions();
    loadChartData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeleting(id);
    await supabase.from("cashflow_transactions").delete().eq("id", id);
    setDeleting(null);
    showToast("Transaksi dihapus.");
    loadTransactions();
  }

  const filteredCats = categories.filter((c) => {
    const typeMap = { income: "in", expense: "out" };
    return c.type === typeMap[form.type as keyof typeof typeMap];
  });
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {showAddForm ? (
        // Full page add/edit form
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {editId ? "Edit Transaksi" : "Tambah Transaksi Baru"}
            </h1>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-700 transition text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 bg-white p-8">
            {/* Transaction Source */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-3">Tipe Transaksi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormSource("cashflow")}
                  className={`py-3 text-sm font-semibold transition ${
                    formSource === "cashflow"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Transaksi Keuangan
                </button>
                <button
                  type="button"
                  onClick={() => setFormSource("offering")}
                  className={`py-3 text-sm font-semibold transition ${
                    formSource === "offering"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Persembahan
                </button>
              </div>
            </div>

            {formSource === "cashflow" && (
              <>
                {/* Tipe for Cashflow */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-3">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.value, category_id: "" }))}
                        className={`py-3 text-sm font-semibold transition ${
                          form.type === t.value
                            ? t.value === "income"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Kategori</label>
                  {filteredCats.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Tidak ada kategori tersedia</p>
                  ) : (
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800"
                    >
                      <option value="">— Pilih —</option>
                      {filteredCats.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Deskripsi *</label>
              <input
                type="text"
                placeholder={formSource === "offering" ? "Jenis Persembahan..." : "Nama transaksi..."}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800"
              />
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Jumlah *</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: formatRupiah(e.target.value) }))}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 text-lg font-bold text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800"
                />
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Tanggal</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800"
              />
            </div>

            {formSource === "cashflow" && (
              <>
                {/* Referensi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">No. Referensi</label>
                  <input
                    type="text"
                    placeholder="Opsional..."
                    value={form.reference_no}
                    onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800"
                  />
                </div>
              </>
            )}

            {/* Catatan / Metode Pembayaran */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {formSource === "offering" ? "Metode Pembayaran" : "Catatan"}
              </label>
              <textarea
                rows={3}
                placeholder={formSource === "offering" ? "Contoh: Tunai, Transfer..." : "Catatan tambahan..."}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 focus:border-gray-800 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
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
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Cashflow</h1>
            <button
              onClick={openAdd}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold transition"
            >
              + Tambah Transaksi
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center py-4 border-b border-gray-200">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-800 focus:outline-none transition"
          />
          <div className="flex gap-0">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${
                  filterType === t
                    ? "bg-gray-800 text-white"
                    : "text-gray-600 hover:text-gray-900"
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
            className="flex-1 min-w-[200px] px-4 py-2 text-sm text-gray-800 focus:outline-none transition"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-8 py-6">
          {[
            { label: "Pemasukan", value: summary.income, color: "text-gray-800" },
            { label: "Pengeluaran", value: summary.expense, color: "text-gray-800" },
            { label: "Saldo Bersih", value: summary.income - summary.expense, color: "text-gray-800" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{displayRupiah(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="py-6 border-t border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-6">Tren Transaksi (12 Bulan Terakhir)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0",
                  }}
                  formatter={(value) => displayRupiah(value as number)}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="income"
                  stroke="#16a34a"
                  dot={false}
                  name="Pemasukan"
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="expense"
                  stroke="#dc2626"
                  dot={false}
                  name="Pengeluaran"
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="net"
                  stroke="#4b5563"
                  dot={false}
                  strokeDasharray="5 5"
                  name="Saldo Bersih"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-center">
              <p className="text-gray-500 text-sm">Loading chart data...</p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-transparent">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Deskripsi</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Tipe</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">Jumlah</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition group">
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {t.transaction_date
                        ? new Date(t.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{t.description}</p>
                      {t.reference_no && (
                        <p className="text-xs text-gray-500 mt-0.5">Ref: {t.reference_no}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.category_name ? (
                        <span className="text-gray-600 text-xs font-medium">
                          {t.category_name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold ${
                          t.type === "income"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {t.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${
                      t.type === "income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {t.type === "expense" ? "−" : "+"}{displayRupiah(t.amount ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id!)}
                          disabled={deleting === t.id}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
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
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {total} transaksi · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-800 text-base">
                {editId ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipe */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Tipe</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.value, category_id: "" }))}
                      className={`py-2.5 text-sm font-semibold transition ${
                        form.type === t.value
                          ? t.value === "income"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi *</label>
                <input
                  type="text"
                  placeholder="Nama transaksi..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 focus:outline-none transition border-b border-gray-200"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Jumlah *</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: formatRupiah(e.target.value) }))}
                    className="w-full pl-9 pr-4 py-2.5 bg-white text-lg font-bold text-gray-800 focus:outline-none transition border-b border-gray-200"
                  />
                </div>
              </div>

              {/* 2-col row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white text-sm text-gray-800 focus:outline-none transition border-b border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Kategori</label>
                  {filteredCats.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Tidak ada kategori tersedia</p>
                  ) : (
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white text-sm text-gray-800 focus:outline-none transition border-b border-gray-200"
                    >
                      <option value="">— Pilih —</option>
                      {filteredCats.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Referensi */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">No. Referensi</label>
                <input
                  type="text"
                  placeholder="Opsional..."
                  value={form.reference_no}
                  onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 focus:outline-none transition border-b border-gray-200"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 focus:outline-none transition border-b border-gray-200 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-6 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
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