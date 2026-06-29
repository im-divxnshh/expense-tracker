// Dependency-free helpers for client-side data export (JSON + CSV downloads).

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download any serializable object as a pretty-printed JSON file. */
export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, filename);
}

function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  // Quote when the value contains a comma, quote, or newline.
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

/** Build a CSV string from records and a column spec. */
export function toCSV<T>(records: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = records
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

/** Build a CSV from records + columns and trigger a download. */
export function downloadCSV<T>(
  filename: string,
  records: T[],
  columns: CsvColumn<T>[],
): void {
  const csv = toCSV(records, columns);
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
