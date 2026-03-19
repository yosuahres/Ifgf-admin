// components/MasterDataTable.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFromBackend } from "../utils/api";
import { exportToExcel } from "../utils/exportutils";
import type { ColumnSchema } from "../utils/exportutils";
import ImportButton from "./ImportButton";

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface MasterDataTableProps<T = any> {
  title: string;
  endpoint: string;
  columns: Column[];
  /** Schema used for both export (embedded metadata) and import (column mapping) */
  exportSchema?: ColumnSchema[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
  /** Called after a successful import so the page can refresh or react */
  onImport?: (rows: Record<string, any>[]) => Promise<void>;
  /** Fires whenever the table's loaded items change — useful to access current rows */
  onItemsChange?: (items: T[]) => void;
}

export default function MasterDataTable<T = any>({
  title,
  endpoint,
  columns,
  exportSchema,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  onItemsChange,
}: MasterDataTableProps<T>) {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Track import completion to trigger table refresh
  const [importKey, setImportKey] = useState(0);

  const toolbarScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const scrollToolbar = (direction: "left" | "right") => {
    if (toolbarScrollRef.current) {
      const { scrollLeft } = toolbarScrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 150 : scrollLeft + 150;
      toolbarScrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const separator = endpoint.includes("?") ? "&" : "?";
      const url = `${endpoint}${separator}${params.toString()}`;

      const res = await fetchFromBackend(url);
      const dataArray = (Array.isArray(res) ? res : res?.data || []) as T[];
      const dataTotal = Array.isArray(res) ? res.length : res?.total || dataArray.length;

      setItems(dataArray);
      setTotal(dataTotal);
      onItemsChange?.(dataArray);
    } catch (e) {
      console.error("Failed to load data:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, debouncedSearch, importKey]); // importKey forces reload after import

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Wrap onImport to trigger table reload after success
  const handleImport = async (rows: Record<string, any>[]) => {
    await onImport?.(rows);
    setImportKey((k) => k + 1); // triggers loadData via useCallback dep
  };

  return (
    <div className="flex flex-col w-full border border-gray-300 bg-white rounded-md overflow-hidden shadow-sm">
      {/* TOOLBAR SECTION */}
      <div className="relative group/toolbar border-b border-gray-300 bg-white">
        <button
          onClick={() => scrollToolbar("left")}
          className="absolute left-0 top-0 bottom-0 z-10 bg-white/90 px-1 border-r border-gray-200 lg:hidden hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={toolbarScrollRef}
          className="flex items-center overflow-x-auto scrollbar-hide h-14 px-8 lg:px-3 gap-6"
        >
          <div className="flex items-center gap-4 shrink-0">
            {/* Export — embeds schema if provided */}
            <button
              onClick={() => exportToExcel(items, title, exportSchema)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap"
            >
              <FileSpreadsheet size={18} /> <span>Export</span>
            </button>

            <div className="w-px h-4 bg-gray-300" />

            {/* Import — only shown if schema + handler provided */}
            {exportSchema && onImport && (
              <>
                <ImportButton
                  schema={exportSchema}
                  onImport={handleImport}
                  label="Import"
                />
                <div className="w-px h-4 bg-gray-300" />
              </>
            )}

            <button
              onClick={onAdd}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap"
            >
              <Plus size={18} /> <span>Add</span>
            </button>
            <button
              disabled={!selected}
              onClick={() => onEdit?.(selected)}
              className="flex items-center gap-2 text-sm text-gray-700 disabled:opacity-30 font-medium whitespace-nowrap"
            >
              <Pencil size={18} /> <span>Edit</span>
            </button>
            <button
              disabled={!selected}
              onClick={() => onDelete?.(selected?.id)}
              className="flex items-center gap-2 text-sm text-red-600 disabled:opacity-30 font-medium whitespace-nowrap"
            >
              <Trash2 size={18} /> <span>Delete</span>
            </button>
          </div>

          <div className="relative min-w-[250px] shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => scrollToolbar("right")}
          className="absolute right-0 top-0 bottom-0 z-10 bg-white/90 px-1 border-l border-gray-200 lg:hidden hover:bg-gray-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* TABLE */}
      <div className="relative">
        <div
          ref={tableScrollRef}
          className="block w-full overflow-x-auto overflow-y-auto max-h-[600px]"
        >
          <table className="table-fixed min-w-[1200px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-30 w-12 border-b border-r border-gray-300 bg-gray-50 p-2 text-center">
                  <input type="checkbox" className="rounded-sm accent-blue-600" />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="w-60 sticky top-0 z-20 border-b border-r border-gray-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{col.label}</span>
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-20 text-center text-gray-400"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    className={`cursor-pointer ${
                      selected?.id === item.id ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td
                      className={`sticky left-0 z-10 border-r border-gray-200 p-2 text-center ${
                        selected?.id === item.id ? "bg-blue-50" : "bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected?.id === item.id}
                        readOnly
                        className="accent-blue-600"
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="border-r border-gray-200 px-4 py-3 text-sm text-gray-700 whitespace-nowrap truncate"
                      >
                        {col.render ? col.render(item[col.key], item) : item[col.key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-4 border-t border-gray-300 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex border rounded border-gray-300 overflow-hidden text-gray-600">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="p-1.5 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-30"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-1.5 text-sm font-bold bg-blue-600 text-white">{page}</div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1.5 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronsRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-black whitespace-nowrap">Show:</span>
            <select
              value={limit === 10000 ? "all" : limit}
              onChange={(e) => {
                const val = e.target.value;
                setLimit(val === "all" ? 10000 : parseInt(val));
                setPage(1);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[10, 20, 50, 100, 200].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-black">
          Showing {items.length} of {total}
        </div>
      </div>
    </div>
  );
}