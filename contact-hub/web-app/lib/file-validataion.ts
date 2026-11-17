export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function validateExcelFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return "Only .xlsx files are allowed.";
  }
  // Some OS/browser combos report an empty type, so only reject a wrong one
  if (file.type && file.type !== XLSX_MIME) {
    return "This doesn't look like a valid Excel (.xlsx) file.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_SIZE) return "File must be 50 MiB or smaller.";
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}