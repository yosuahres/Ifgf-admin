// components/ReportFilterBar.tsx
"use client";

import { X } from "lucide-react";
import type { FilterConfig, ActiveFilters } from "@/types/report.types";

interface Props {
  filters: FilterConfig[];
  values: ActiveFilters;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
}

export default function ReportFilterBar({ filters, values, onChange, onClear }: Props) {
  const activeCount = Object.values(values).filter(
    (v) => v !== undefined && v !== "" && v !== null &&
    !(Array.isArray(v) && v.length === 0) &&
    !(typeof v === "object" && !Array.isArray(v) && !v.from && !v.to)
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Filter
        </span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            <X size={12} />
            Reset {activeCount} filter{activeCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filters.map((filter) => (
          <FilterInput
            key={filter.key}
            filter={filter}
            value={values[filter.key]}
            onChange={(v) => onChange(filter.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterInput({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: any;
  onChange: (v: any) => void;
}) {
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";
  const inputCls =
    "w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300";

  switch (filter.type) {
    case "text":
      return (
        <div>
          <label className={labelCls}>{filter.label}</label>
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={filter.placeholder ?? `Cari ${filter.label.toLowerCase()}...`}
            className={inputCls}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className={labelCls}>{filter.label}</label>
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className={inputCls}
          >
            <option value="">— Semua —</option>
            {filter.options?.map((o: { value: string; label: string }) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );

    case "multiselect":
      return (
        <div>
          <label className={labelCls}>{filter.label}</label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-md min-h-[38px] bg-white">
            {filter.options?.map((o: { value: string; label: string }) => {
              const selected: string[] = value ?? [];
              const isActive = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    const next = isActive
                      ? selected.filter((s) => s !== o.value)
                      : [...selected, o.value];
                    onChange(next.length ? next : undefined);
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      );

    case "date_range":
      return (
        <div>
          <label className={labelCls}>{filter.label}</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={value?.from ?? ""}
              onChange={(e) =>
                onChange({ ...(value ?? {}), from: e.target.value || undefined })
              }
              className={inputCls}
            />
            <span className="text-gray-300 text-xs shrink-0">–</span>
            <input
              type="date"
              value={value?.to ?? ""}
              onChange={(e) =>
                onChange({ ...(value ?? {}), to: e.target.value || undefined })
              }
              className={inputCls}
            />
          </div>
        </div>
      );

    case "number_range":
      return (
        <div>
          <label className={labelCls}>{filter.label}</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={value?.min ?? ""}
              placeholder="Min"
              onChange={(e) =>
                onChange({ ...(value ?? {}), min: e.target.value ? Number(e.target.value) : undefined })
              }
              className={inputCls}
            />
            <span className="text-gray-300 text-xs shrink-0">–</span>
            <input
              type="number"
              value={value?.max ?? ""}
              placeholder="Max"
              onChange={(e) =>
                onChange({ ...(value ?? {}), max: e.target.value ? Number(e.target.value) : undefined })
              }
              className={inputCls}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}