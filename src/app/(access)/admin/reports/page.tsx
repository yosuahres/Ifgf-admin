// app/(access)/admin/reports/page.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REPORT_CONFIGS } from "@/config/reportConfigs";
import ReportFilterBar from "@/components/ReportFilterBar";
import { runReportQuery } from "@/utils/reportQuery";
import { exportToExcel } from "@/utils/exportutils";
import type { ActiveFilters, ReportConfig } from "@/types/report.types";

export default function ReportsPage() {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedConfigId, setSelectedConfigId] = useState<string>(REPORT_CONFIGS[0].id);
  const [filters, setFilters]           = useState<ActiveFilters>({});
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [showFilters, setShowFilters]   = useState(true);
  const [data, setData]                 = useState<any[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(50);

  const config: ReportConfig =
    REPORT_CONFIGS.find((c) => c.id === selectedConfigId) ?? REPORT_CONFIGS[0];

  const totalPages = Math.ceil(total / limit) || 1;

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Reset state when config changes ───────────────────────────────────────
  useEffect(() => {
    setFilters({});
    setSearch("");
    setDebounced("");
    setPage(1);
    setData([]);
    setTotal(0);
  }, [selectedConfigId]);

  // ── Run query ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runReportQuery(
        supabase, config, filters, debouncedSearch, page, limit
      );
      setData(result.data);
      setTotal(result.total);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [config, filters, debouncedSearch, page, limit]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  };

  const handleClearFilters = () => { setFilters({}); setSearch(""); setPage(1); };

  const handleExport = async () => {
    // Export ALL matching rows (no pagination)
    setLoading(true);
    try {
      const result = await runReportQuery(
        supabase, config, filters, debouncedSearch, 1, 10000
      );
      exportToExcel(result.data, config.label);
    } finally {
      setLoading(false);
    }
  };

  const activeFilterCount = Object.keys(filters).length + (search ? 1 : 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Filter dan ekspor data secara dinamis
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || data.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Download size={16} />
          Export Excel
          {total > 0 && <span className="bg-blue-500 px-1.5 py-0.5 rounded text-xs">{total}</span>}
        </button>
      </div>

      {/* ── Report Selector ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {REPORT_CONFIGS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedConfigId(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedConfigId === c.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${config.label.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
            showFilters
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filter
          {activeFilterCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              showFilters ? "bg-white text-gray-900" : "bg-blue-600 text-white"
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Result count */}
        <span className="text-sm text-gray-400 ml-auto">
          {loading ? "Memuat..." : `${total.toLocaleString("id-ID")} hasil`}
        </span>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      {showFilters && config.filters.length > 0 && (
        <ReportFilterBar
          filters={config.filters}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      )}

      {/* ── Active filter chips ─────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Aktif:</span>
          {search && (
            <Chip label={`Cari: "${search}"`} onRemove={() => setSearch("")} />
          )}
          {Object.entries(filters).map(([key, val]) => {
            const def = config.filters.find((f) => f.key === key);
            if (!def) return null;
            const display = formatChipLabel(def.type, val, def);
            return (
              <Chip
                key={key}
                label={`${def.label}: ${display}`}
                onRemove={() => handleFilterChange(key, undefined)}
              />
            );
          })}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[560px]">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {config.columns.map((col) => (
                  <th
                    key={col.key}
                    className="sticky top-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={config.columns.length} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Filter size={32} className="opacity-30" />
                      <span className="text-sm">Tidak ada data yang cocok dengan filter</span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleClearFilters}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Reset semua filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-gray-50 transition-colors">
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[220px] truncate"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-gray-600">
              <PagBtn disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} /></PagBtn>
              <PagBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></PagBtn>
              <div className="px-4 py-1.5 text-sm font-bold bg-gray-900 text-white">{page}</div>
              <PagBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></PagBtn>
              <PagBtn disabled={page >= totalPages} onClick={() => setPage(totalPages)}><ChevronsRight size={16} /></PagBtn>
            </div>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[25, 50, 100, 200].map((v) => (
                <option key={v} value={v}>{v} per halaman</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500">
            {data.length > 0
              ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} dari ${total.toLocaleString("id-ID")}`
              : "0 hasil"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900">
        <X size={11} />
      </button>
    </span>
  );
}

function PagBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 hover:bg-gray-100 border-r border-gray-200 last:border-r-0 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function formatChipLabel(type: string, val: any, def: any): string {
  if (type === "multiselect" && Array.isArray(val)) {
    return val
      .map((v) => def.options?.find((o: any) => o.value === v)?.label ?? v)
      .join(", ");
  }
  if (type === "select") {
    return def.options?.find((o: any) => o.value === String(val))?.label ?? String(val);
  }
  if (type === "date_range") {
    const { from, to } = val ?? {};
    if (from && to) return `${from} s/d ${to}`;
    if (from) return `dari ${from}`;
    if (to)   return `s/d ${to}`;
  }
  if (type === "number_range") {
    const { min, max } = val ?? {};
    if (min !== undefined && max !== undefined) return `${min} – ${max}`;
    if (min !== undefined) return `≥ ${min}`;
    if (max !== undefined) return `≤ ${max}`;
  }
  return String(val);
}