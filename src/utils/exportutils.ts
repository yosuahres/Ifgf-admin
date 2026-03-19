// utils/exportutils.ts
import { utils, writeFile } from "xlsx";

export interface ColumnSchema {
  key: string;
  label: string;
  type?: "string" | "number" | "boolean" | "date";
  required?: boolean;
}

/**
 * Exports data to Excel with a schema header row embedded as row 1 (hidden metadata),
 * a human-readable column header as row 2, and data starting from row 3.
 *
 * The schema row format: __SCHEMA__:<JSON stringified ColumnSchema[]>
 * This makes the exported file self-describing so importFromExcel can validate it.
 */
export function exportToExcel(
  data: any[],
  title: string,
  columns?: ColumnSchema[]
) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const workbook = utils.book_new();

  // Derive columns from data keys if not provided
  const schema: ColumnSchema[] =
    columns && columns.length > 0
      ? columns
      : Object.keys(data[0]).map((key) => ({
          key,
          label: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          type: typeof data[0][key] === "number" ? "number" : "string",
        }));

  const keys = schema.map((col) => col.key);
  const labels = schema.map((col) => col.label);

  // Row 1: Schema metadata (hidden row for round-trip import)
  const schemaRow = [`__SCHEMA__:${JSON.stringify(schema)}`];

  // Row 2: Human-readable headers
  const headerRow = labels;

  // Rows 3+: Data rows (only export keys defined in schema)
  const dataRows = data.map((item) =>
    keys.map((key) => {
      const val = item[key];
      if (val === null || val === undefined) return "";
      return val;
    })
  );

  const aoa = [schemaRow, headerRow, ...dataRows];
  const worksheet = utils.aoa_to_sheet(aoa);

  // Style: hide row 1 (schema row) by setting row height to 0
  if (!worksheet["!rows"]) worksheet["!rows"] = [];
  worksheet["!rows"][0] = { hidden: true, hpt: 0 };

  // Set column widths based on label lengths
  worksheet["!cols"] = schema.map((col) => ({
    wch: Math.max(col.label.length + 4, 16),
  }));

  utils.book_append_sheet(workbook, worksheet, "Data");

  // Add a Schema Info sheet for human reference
  const schemaInfoRows = [
    ["Field Key", "Label", "Type", "Required"],
    ...schema.map((col) => [
      col.key,
      col.label,
      col.type || "string",
      col.required ? "Yes" : "No",
    ]),
  ];
  const schemaSheet = utils.aoa_to_sheet(schemaInfoRows);
  schemaSheet["!cols"] = [
    { wch: 24 },
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
  ];
  utils.book_append_sheet(workbook, schemaSheet, "Schema Info");

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `${title.replace(/\s+/g, "_")}_${timestamp}.xlsx`;
  writeFile(workbook, filename);
}

/**
 * Generates an empty Excel template for a given schema.
 * Useful for giving users a blank import template.
 */
export function exportTemplate(title: string, columns: ColumnSchema[]) {
  exportToExcel([], title, columns);

  // Since exportToExcel bails on empty data, handle separately:
  const workbook = utils.book_new();

  const schemaRow = [`__SCHEMA__:${JSON.stringify(columns)}`];
  const headerRow = columns.map((col) => col.label);

  const aoa = [schemaRow, headerRow];
  const worksheet = utils.aoa_to_sheet(aoa);

  if (!worksheet["!rows"]) worksheet["!rows"] = [];
  worksheet["!rows"][0] = { hidden: true, hpt: 0 };
  worksheet["!cols"] = columns.map((col) => ({
    wch: Math.max(col.label.length + 4, 16),
  }));

  utils.book_append_sheet(workbook, worksheet, "Data");

  const schemaInfoRows = [
    ["Field Key", "Label", "Type", "Required"],
    ...columns.map((col) => [
      col.key,
      col.label,
      col.type || "string",
      col.required ? "Yes" : "No",
    ]),
  ];
  const schemaSheet = utils.aoa_to_sheet(schemaInfoRows);
  schemaSheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 12 }, { wch: 10 }];
  utils.book_append_sheet(workbook, schemaSheet, "Schema Info");

  const filename = `${title.replace(/\s+/g, "_")}_template.xlsx`;
  writeFile(workbook, filename);
}