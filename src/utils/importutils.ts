// utils/importutils.ts
import { read, utils } from "xlsx";
import type { ColumnSchema } from "./exportutils";

export interface ImportResult<T = Record<string, any>> {
  data: T[];
  errors: ImportError[];
  schema: ColumnSchema[] | null;
  totalRows: number;
  validRows: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export async function importFromExcel<T = Record<string, any>>(
  file: File,
  options?: {
    schema?: ColumnSchema[];
    skipInvalidRows?: boolean;
    sheetName?: string;
  }
): Promise<ImportResult<T>> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });

  const sheetName =
    options?.sheetName || workbook.SheetNames[0] || "Data";
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return {
      data: [],
      errors: [{ row: 0, message: `Sheet "${sheetName}" not found in file.` }],
      schema: null,
      totalRows: 0,
      validRows: 0,
    };
  }

  // Read all rows as arrays (raw, no header inference)
  const rows: any[][] = utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    return {
      data: [],
      errors: [{ row: 0, message: "File is empty." }],
      schema: null,
      totalRows: 0,
      validRows: 0,
    };
  }

  let schema: ColumnSchema[] | null = options?.schema || null;
  let headerRowIndex = 0;
  let dataStartIndex = 1;

  // Detect embedded schema in row 1
  const firstCell = String(rows[0]?.[0] || "");
  if (firstCell.startsWith("__SCHEMA__:")) {
    try {
      const jsonStr = firstCell.replace("__SCHEMA__:", "");
      schema = JSON.parse(jsonStr) as ColumnSchema[];
      headerRowIndex = 1;
      dataStartIndex = 2;
    } catch {
      // schema parse failed, fall through
    }
  }

  // If still no schema, build from header row
  if (!schema) {
    const headers: string[] = rows[headerRowIndex] || [];
    schema = headers.map((label) => ({
      key: label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, ""),
      label: String(label),
      type: "string" as const,
    }));
    dataStartIndex = headerRowIndex + 1;
  }

  const headerLabels: string[] = rows[headerRowIndex]?.map(String) || [];
  const errors: ImportError[] = [];
  const data: T[] = [];

  // Map column index → schema entry by matching header label
  const columnMap: Record<number, ColumnSchema> = {};
  schema.forEach((col) => {
    const idx = headerLabels.findIndex(
      (h) => h.trim().toLowerCase() === col.label.trim().toLowerCase()
    );
    if (idx !== -1) {
      columnMap[idx] = col;
    }
  });

  // Warn about unmatched schema columns
  schema.forEach((col) => {
    const matched = Object.values(columnMap).some((c) => c.key === col.key);
    if (!matched) {
      errors.push({
        row: 0,
        field: col.key,
        message: `Column "${col.label}" not found in file. It will be skipped.`,
      });
    }
  });

  // Parse data rows
  const dataRows = rows.slice(dataStartIndex);
  let validRows = 0;

  dataRows.forEach((row, rowIndex) => {
    const humanRow = rowIndex + dataStartIndex + 1; // 1-based row number for user
    const record: Record<string, any> = {};
    let rowHasError = false;

    Object.entries(columnMap).forEach(([colIdx, col]) => {
      const rawValue = row[Number(colIdx)];
      const value = rawValue === undefined || rawValue === "" ? null : rawValue;

      // Required field check
      if (col.required && (value === null || value === "")) {
        errors.push({
          row: humanRow,
          field: col.key,
          message: `"${col.label}" is required but missing in row ${humanRow}.`,
        });
        rowHasError = true;
        return;
      }

      // Type coercion
      record[col.key] = coerceValue(value, col.type || "string");
    });

    if (rowHasError && options?.skipInvalidRows) return;

    // Skip entirely blank rows
    const allEmpty = Object.values(record).every(
      (v) => v === null || v === ""
    );
    if (allEmpty) return;

    data.push(record as T);
    if (!rowHasError) validRows++;
  });

  return {
    data,
    errors,
    schema,
    totalRows: dataRows.filter((r) =>
      r.some((c) => c !== null && c !== "")
    ).length,
    validRows,
  };
}

function coerceValue(value: any, type: string): any {
  if (value === null || value === undefined || value === "") return null;

  switch (type) {
    case "number": {
      const n = Number(value);
      return isNaN(n) ? null : n;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      const str = String(value).toLowerCase().trim();
      if (["true", "yes", "1", "ya"].includes(str)) return true;
      if (["false", "no", "0", "tidak"].includes(str)) return false;
      return null;
    }
    case "date": {
      // Excel serial date number support
      if (typeof value === "number") {
        const date = excelSerialToDate(value);
        return date ? date.toISOString().split("T")[0] : null;
      }
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toISOString().split("T")[0];
    }
    default:
      return String(value).trim();
  }
}

function excelSerialToDate(serial: number): Date | null {
  // Excel's epoch starts Jan 1 1900, with a leap year bug on day 60
  if (serial < 1) return null;
  const utcDays = serial - 25569; // offset to Unix epoch
  const utcMs = utcDays * 86400 * 1000;
  const d = new Date(utcMs);
  return isNaN(d.getTime()) ? null : d;
}