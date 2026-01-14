// src/lib/utils/api-helpers.ts
// Created: API response helpers for consistent error handling and responses

import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * Standard response type for server actions
 */
export type ActionResult<T = void> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string };

/**
 * Create a successful response
 */
export function successResponse<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Create an error response
 */
export function errorResponse(error: string, code?: string): ActionResult<never> {
  return { success: false, error, code };
}

/**
 * Handle Supabase errors and return user-friendly messages
 */
export function handleSupabaseError(error: unknown): ActionResult<never> {
  console.error("Supabase error:", error);
  console.error("Full error object:", JSON.stringify(error, null, 2));

  if (error && typeof error === "object" && "code" in error) {
    const supabaseError = error as { code: string; message: string; details?: string; hint?: string };

    console.error("Supabase error details:", {
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint
    });

    // Map common Supabase error codes to user-friendly messages
    switch (supabaseError.code) {
      case "23505": // Unique violation
        return errorResponse("This item already exists.", "DUPLICATE");
      case "23503": // Foreign key violation
        return errorResponse("Related record not found.", "NOT_FOUND");
      case "42501": // Permission denied
        return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, "UNAUTHORIZED");
      case "PGRST116": // No rows returned
        return errorResponse(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND");
      default:
        return errorResponse(ERROR_MESSAGES.GENERIC, supabaseError.code);
    }
  }

  if (error instanceof Error) {
    // Log detailed error for debugging (server-side only)
    console.error("Error details:", error.message, error.stack);
    return errorResponse(ERROR_MESSAGES.GENERIC);
  }

  return errorResponse(ERROR_MESSAGES.GENERIC);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return ERROR_MESSAGES.GENERIC;
}

/**
 * Delay execution (useful for testing loading states)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, shouldRetry = () => true } = options ?? {};
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }
  
  throw lastError;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "10", 10)));
  const sortBy = searchParams.get("sortBy") ?? undefined;
  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder = sortOrderParam === "asc" || sortOrderParam === "desc" ? sortOrderParam : undefined;
  
  return { page, perPage, sortBy, sortOrder };
}
