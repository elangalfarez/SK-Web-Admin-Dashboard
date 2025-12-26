// src/lib/utils/format-currency.ts
// Created: Currency and number formatting utilities for Indonesian Rupiah and general numbers

/**
 * Format a number as Indonesian Rupiah
 * @example formatCurrency(15000000) → "Rp 15.000.000"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options ?? {};
  
  if (amount === null || amount === undefined || amount === "") {
    return showSymbol ? "Rp 0" : "0";
  }
  
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? "Rp 0" : "0";
  }
  
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
  
  return showSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Format a number with thousand separators
 * @example formatNumber(1234567) → "1.234.567"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options ?? {};
  
  if (value === null || value === undefined || value === "") {
    return "0";
  }
  
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return "0";
  }
  
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

/**
 * Format a number as a compact string (e.g., 1.5K, 2.3M)
 * @example formatCompact(1500000) → "1,5 jt"
 */
export function formatCompact(
  value: number | string | null | undefined,
  locale: "id" | "en" = "id"
): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }
  
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return "0";
  }
  
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  
  if (locale === "id") {
    // Indonesian format: rb (ribu), jt (juta), M (miliar)
    if (absValue >= 1_000_000_000) {
      return `${sign}${(numericValue / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}${(numericValue / 1_000_000).toFixed(1).replace(".", ",")} jt`;
    }
    if (absValue >= 1_000) {
      return `${sign}${(numericValue / 1_000).toFixed(1).replace(".", ",")} rb`;
    }
    return formatNumber(numericValue);
  }
  
  // English format: K, M, B
  if (absValue >= 1_000_000_000) {
    return `${sign}${(numericValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(numericValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(numericValue / 1_000).toFixed(1)}K`;
  }
  return formatNumber(numericValue);
}

/**
 * Format a percentage value
 * @example formatPercent(0.156) → "15,6%"
 */
export function formatPercent(
  value: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    multiply?: boolean; // If true, multiply by 100 (for decimal percentages)
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    multiply = false,
  } = options ?? {};
  
  if (value === null || value === undefined || value === "") {
    return "0%";
  }
  
  let numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return "0%";
  }
  
  if (multiply) {
    numericValue = numericValue * 100;
  }
  
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue)}%`;
}

/**
 * Parse a formatted currency string back to number
 * @example parseCurrency("Rp 15.000.000") → 15000000
 */
export function parseCurrency(value: string | null | undefined): number {
  if (!value) return 0;
  
  // Remove currency symbol and whitespace
  const cleaned = value
    .replace(/Rp\s?/gi, "")
    .replace(/\s/g, "")
    // Replace Indonesian thousand separator (.) with nothing
    .replace(/\./g, "")
    // Replace Indonesian decimal separator (,) with dot
    .replace(/,/g, ".");
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format bytes to human readable size
 * @example formatFileSize(1536000) → "1,46 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return "0 B";
  }
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, exponent);
  
  return `${size.toFixed(2).replace(".", ",")} ${units[exponent]}`;
}

/**
 * Format a phone number for display
 * @example formatPhone("081234567890") → "0812-3456-7890"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Indonesian mobile format: 0812-3456-7890
  if (digits.length === 11 || digits.length === 12 || digits.length === 13) {
    // Format: XXXX-XXXX-XXXX or XXX-XXXX-XXXX
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 12) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  
  // Return as-is if format doesn't match expected patterns
  return phone;
}
