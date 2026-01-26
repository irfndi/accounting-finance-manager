/**
 * File Parsers
 * Utilities for parsing Excel, CSV, and other file formats
 */

export interface ParsedFileData {
  headers: string[];
  rows: any[][];
  rowCount: number;
  metadata?: {
    sheetNames?: string[];
    selectedSheet?: string;
    encoding?: string;
  };
}

export interface ParserOptions {
  maxRows?: number;
  skipEmptyRows?: boolean;
  trimValues?: boolean;
  headerRow?: number;
  sheet?: string | number;
}

/**
 * Parse CSV file from ArrayBuffer
 */
export async function parseCSV(
  buffer: ArrayBuffer,
  options: ParserOptions = {},
): Promise<ParsedFileData> {
  const {
    maxRows,
    skipEmptyRows = true,
    trimValues = true,
    headerRow = 0,
  } = options;

  // Convert ArrayBuffer to string
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(buffer);

  // Simple CSV parser (handles quoted fields and commas)
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && skipEmptyRows) continue;

    // Parse CSV line handling quotes and commas
    const row = parseCSVLine(line, trimValues);
    rows.push(row);

    if (maxRows && rows.length >= maxRows + headerRow + 1) break;
  }

  // Extract headers
  const headers = rows[headerRow] || [];
  const dataRows = rows.slice(headerRow + 1);

  return {
    headers,
    rows: dataRows,
    rowCount: dataRows.length,
    metadata: {
      encoding: "utf-8",
    },
  };
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line: string, trim: boolean): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(trim ? current.trim() : current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(trim ? current.trim() : current);

  // Warn if quotes are unclosed
  if (inQuotes) {
    console.warn("Warning: Unclosed quote detected in CSV line");
  }

  return result;
}

/**
 * Parse Excel file from ArrayBuffer
 * Note: This is a simplified version. In production, use a library like xlsx or excelize-wasm
 */
export async function parseExcel(
  buffer: ArrayBuffer,
  options: ParserOptions = {},
): Promise<ParsedFileData> {
  const {
    maxRows: _maxRows = 1000,
    skipEmptyRows: _skipEmptyRows = true,
    trimValues: _trimValues = true,
    headerRow: _headerRow = 0,
    sheet: _sheet = 0,
  } = options;

  try {
    // Dynamic import to avoid bundling if not needed
    // For now, we'll use a simple CSV-like parsing for Excel
    // In production, integrate with excelize-wasm or xlsx library

    // Try to detect if this is actually a CSV file pretending to be Excel
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(buffer.slice(0, 1024));

    if (text.includes(",") && !text.includes("\x00")) {
      // Likely CSV, use CSV parser
      return parseCSV(buffer, options);
    }

    // For real Excel files, we need a proper library
    // This is a placeholder that should be replaced with actual Excel parsing
    throw new Error(
      "Native Excel (.xlsx/.xls) parsing is not yet supported. Please export your spreadsheet as CSV and upload that instead.",
    );
  } catch (error) {
    throw new Error(
      `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Parse JSON file from ArrayBuffer
 */
export async function parseJSON(
  buffer: ArrayBuffer,
  options: ParserOptions = {},
): Promise<ParsedFileData> {
  const { maxRows, trimValues = true } = options;

  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(buffer);

  try {
    const data = JSON.parse(text);

    // Handle different JSON structures
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return {
          headers: [],
          rows: [],
          rowCount: 0,
        };
      }

      // Extract headers from first object
      const firstItem = data[0];
      const headers =
        typeof firstItem === "object" ? Object.keys(firstItem) : ["value"];

      // Convert objects to arrays
      const rows = data.slice(0, maxRows || data.length).map((item) => {
        if (typeof item === "object" && item !== null) {
          return headers.map((h) => {
            const value = item[h];
            return trimValues && typeof value === "string"
              ? value.trim()
              : value;
          });
        }
        return [item];
      });

      return {
        headers,
        rows,
        rowCount: rows.length,
      };
    } else if (typeof data === "object" && data !== null) {
      // Single object - treat as one row
      const headers = Object.keys(data);
      const row = headers.map((h) => {
        const value = data[h];
        return trimValues && typeof value === "string" ? value.trim() : value;
      });

      return {
        headers,
        rows: [row],
        rowCount: 1,
      };
    }

    throw new Error("Invalid JSON structure: expected array or object");
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseFile(
  buffer: ArrayBuffer,
  fileName: string,
  options: ParserOptions = {},
): Promise<ParsedFileData> {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;

  switch (ext) {
    case "csv":
    case "txt":
      return parseCSV(buffer, options);

    case "xlsx":
    case "xls":
      return parseExcel(buffer, options);

    case "json":
      return parseJSON(buffer, options);

    default:
      throw new Error(
        `Unsupported file type: ${ext ?? "unknown (no extension)"}`,
      );
  }
}

/**
 * Validate file size and type
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ["csv", "xlsx", "xls", "json", "txt"],
  } = options;

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)} MB)`,
    };
  }

  // Check type
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !allowedTypes.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is not supported. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Detect data type from column values
 */
export function detectColumnType(
  values: any[],
): "string" | "number" | "date" | "boolean" {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );

  if (nonEmpty.length === 0) return "string";

  // Check if all values are numbers
  const allNumbers = nonEmpty.every(
    (v) => !isNaN(Number(v)) && String(v).trim() !== "",
  );
  if (allNumbers) return "number";

  // Check if all values are dates
  const allDates = nonEmpty.every((v) => {
    const str = String(v);
    // Require date-like format first (ISO or common US/EU formats)
    if (!str.match(/^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
      return false;
    }
    const d = new Date(v);
    return !isNaN(d.getTime());
  });
  if (allDates) return "date";

  // Check if all values are booleans
  const allBooleans = nonEmpty.every((v) =>
    ["true", "false", "yes", "no", "1", "0"].includes(String(v).toLowerCase()),
  );
  if (allBooleans) return "boolean";

  return "string";
}

/**
 * Clean and normalize column name
 */
export function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

/**
 * Extract sample values from column
 */
export function extractSampleValues(
  rows: any[][],
  columnIndex: number,
  count = 5,
): string[] {
  return rows
    .slice(0, count)
    .map((row) => String(row[columnIndex] || ""))
    .filter((v) => v.trim() !== "");
}
