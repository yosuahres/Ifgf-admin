// user/cashflow/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
} from "lucide-react";
import MasterDataTable from "@/components/MasterDataTable";
import ModalForm from "@/components/ModalForm";
import { fetchFromBackend } from "@/utils/api";
import type { ColumnSchema } from "@/utils/exportutils";

interface CashflowTransaction {
  id: string;
  transaction_date: string;
  type: "in" | "out";
  category_id: string;
  category_name: string;
  description: string;
  amount: number;
  reference_no?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  type: "in" | "out";
}

interface MonthlySummary {
  total_in: number;
  total_out: number;
  net: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Export schema ────────────────────────────────────────────────────────────

const exportSchema: ColumnSchema[] = [
  { key: "transaction_date", label: "Date",         type: "date" },
  { key: "type",             label: "Type" },
  { key: "category_name",    label: "Category" },
  { key: "description",      label: "Description" },
  { key: "amount",           label: "Amount",       type: "number" },
  { key: "reference_no",     label: "Reference No" },
  { key: "notes",            label: "Notes" },
];

// ─── Table columns ────────────────────────────────────────────────────────────

const columns = [
  {
    key: "transaction_date",
    label: "Date",
    render: (v: string) => fmtDate(v),
  },
  {
    key: "type",
    label: "Type",
    render: (v: "in" | "out") =>
      v === "in" ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <ArrowDownCircle size={12} /> Cash In
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          <ArrowUpCircle size={12} /> Cash Out
        </span>
      ),
  },
  { key: "category_name", label: "Category" },
  { key: "description",   label: "Description" },
  {
    key: "amount",
    label: "Amount",
    render: (v: number, item: CashflowTransaction) => (
      <span className={`font-semibold ${item.type === "in" ? "text-emerald-700" : "text-rose-700"}`}>
        {item.type === "out" ? "– " : "+ "}
        {IDR(v)}
      </span>
    ),
  },
  { key: "reference_no", label: "Reference No" },
  { key: "notes",        label: "Notes" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "emerald" | "rose" | "blue";
  sub?: string;
}) {
  const colorMap = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    rose:    "bg-rose-50 border-rose-200 text-rose-700",
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
  };
  const iconBg = {
    emerald: "bg-emerald-100 text-emerald-600",
    rose:    "bg-rose-100 text-rose-600",
    blue:    "bg-blue-100 text-blue-600",
  };

  return (
    <div className={`rounded-xl border ${colorMap[color]} p-5 flex items-center gap-4`}>
      <div className={`rounded-lg p-3 ${iconBg[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">{label}</p>
        <p className="text-xl font-bold truncate">{IDR(value)}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CashflowPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({ total_in: 0, total_out: 0, net: 0 });
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CashflowTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // ← drives table reload

  const triggerRefresh = () => setRefreshTrigger((k) => k + 1);

  const endpoint = `/api/cashflow?month=${filterMonth}`;

  // ── Load categories ──
  useEffect(() => {
    fetchFromBackend("/api/cashflow/categories")
      .then((res) => {
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (res && Array.isArray(res.data)) arr = res.data;
        if (
          arr.every(
            (c) =>
              c &&
              typeof c === "object" &&
              typeof c.id === "string" &&
              typeof c.name === "string" &&
              (c.type === "in" || c.type === "out"),
          )
        ) {
          setCategories(arr as Category[]);
        } else {
          setCategories([]);
        }
      })
      .catch(console.error);
  }, []);

  // ── Summary from loaded rows ──
  const handleItemsChange = useCallback((items: CashflowTransaction[]) => {
    const total_in  = items.reduce((s, r) => (r.type === "in"  ? s + r.amount : s), 0);
    const total_out = items.reduce((s, r) => (r.type === "out" ? s + r.amount : s), 0);
    setSummary({ total_in, total_out, net: total_in - total_out });
  }, []);

  // ── Form fields ──
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.type === "in" ? "Cash In" : "Cash Out"})`,
  }));

  const formFields = [
    { name: "transaction_date", label: "Date",           type: "date" as const,     required: true },
    {
      name: "type", label: "Type", type: "select" as const, required: true,
      options: [
        { value: "in",  label: "Cash In" },
        { value: "out", label: "Cash Out" },
      ],
    },
    { name: "category_id",  label: "Category",     type: "select" as const,   required: true, options: categoryOptions },
    { name: "description",  label: "Description",  type: "text" as const,     required: true, placeholder: "e.g. Sunday morning offering" },
    { name: "amount",       label: "Amount (IDR)", type: "text" as const,     required: true, placeholder: "e.g. 500000" },
    { name: "reference_no", label: "Reference No", type: "text" as const,     placeholder: "Optional" },
    { name: "notes",        label: "Notes",        type: "textarea" as const, placeholder: "Additional notes..." },
  ];

  // ── CRUD handlers ──
  const handleAdd = () => { setEditItem(null); setModalOpen(true); };
  const handleEdit = (item: CashflowTransaction) => { setEditItem(item); setModalOpen(true); };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/cashflow/${id}`, { method: "DELETE" });
    if (res.ok) triggerRefresh(); // ← re-fetch table
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        amount: parseFloat(String(data.amount).replace(/[^0-9.]/g, "")),
      };
      const res = editItem
        ? await fetch(`/api/cashflow/${editItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/cashflow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        setModalOpen(false);
        setEditItem(null);
        triggerRefresh(); // ← re-fetch table
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Church Cashflow</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all cash-in and cash-out transactions</p>
        </div>

        {/* Month filter */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
          <Calendar size={16} className="text-gray-400" />
          <label className="text-sm text-gray-500 font-medium whitespace-nowrap">Month:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="text-sm font-semibold text-gray-800 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Cash In" value={summary.total_in} icon={TrendingUp} color="emerald"
          sub={`for ${new Date(filterMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`}
        />
        <StatCard
          label="Total Cash Out" value={summary.total_out} icon={TrendingDown} color="rose"
          sub={`for ${new Date(filterMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`}
        />
        <StatCard
          label="Net Balance" value={summary.net} icon={Wallet}
          color={summary.net >= 0 ? "blue" : "rose"}
          sub={summary.net >= 0 ? "Surplus this month" : "Deficit this month"}
        />
      </div>

      {/* Table */}
      <MasterDataTable<CashflowTransaction>
        title={`Cashflow_${filterMonth}`}
        endpoint={endpoint}
        columns={columns}
        exportSchema={exportSchema}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onItemsChange={handleItemsChange}
        refreshTrigger={refreshTrigger} // ← drives reload after edit/delete
      />

      {/* Modal */}
      <ModalForm
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? "Edit Transaction" : "Add Transaction"}
        fields={formFields}
        onSubmit={handleSubmit}
        initialData={editItem}
        submitText={editItem ? "Save Changes" : "Add Transaction"}
        isLoading={submitting}
      />
    </div>
  );
}