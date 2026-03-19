// types/report.types.ts

export type FilterType =
  | "text"        // free text search (ilike)
  | "select"      // exact match from dropdown
  | "multiselect" // match any of selected values
  | "date_range"  // between two dates
  | "boolean"     // true / false toggle
  | "number_range"; // between two numbers

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;           // supabase column name
  label: string;         // display label
  type: FilterType;
  options?: FilterOption[]; // for select / multiselect
  placeholder?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ReportConfig {
  id: string;
  label: string;           // e.g. "Data Jemaat"
  table: string;           // supabase table name
  select: string;          // supabase select string (supports joins)
  filters: FilterDef[];
  columns: ColumnDef[];
  defaultSort?: { column: string; ascending: boolean };
  searchColumn?: string;   // column used for global text search
}

export type ActiveFilters = Record<string, any>;