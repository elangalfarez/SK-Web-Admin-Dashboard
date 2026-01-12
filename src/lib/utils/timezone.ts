/**
 * Timezone utilities for handling Asia/Jakarta (GMT+7) conversions
 */

import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
import { parseISO } from "date-fns";

export const APP_TIMEZONE = "Asia/Jakarta";

/**
 * Converts a datetime-local input value (YYYY-MM-DDTHH:mm) from Asia/Jakarta to UTC ISO string
 * This is used when saving event times from the form to the database
 *
 * @param dateTimeLocal - The datetime-local input value (e.g., "2025-12-25T10:00")
 * @returns ISO string in UTC (e.g., "2025-12-25T03:00:00.000Z")
 *
 * @example
 * // User inputs 10:00 in GMT+7
 * convertLocalToUTC("2025-12-25T10:00") // Returns "2025-12-25T03:00:00.000Z"
 */
export function convertLocalToUTC(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";

  // Parse the datetime-local value as if it's in Asia/Jakarta timezone
  const date = new Date(dateTimeLocal);

  // Convert from Asia/Jakarta to UTC
  const utcDate = fromZonedTime(date, APP_TIMEZONE);

  return utcDate.toISOString();
}

/**
 * Converts a UTC ISO string to datetime-local format in Asia/Jakarta timezone
 * This is used when loading event times from the database to the form
 *
 * @param isoString - UTC ISO string (e.g., "2025-12-25T03:00:00.000Z")
 * @returns datetime-local format in Asia/Jakarta (e.g., "2025-12-25T10:00")
 *
 * @example
 * // Database has 03:00 UTC
 * convertUTCToLocal("2025-12-25T03:00:00.000Z") // Returns "2025-12-25T10:00"
 */
export function convertUTCToLocal(isoString: string | null | undefined): string {
  if (!isoString) return "";

  // Parse the UTC ISO string
  const date = parseISO(isoString);

  // Convert to Asia/Jakarta timezone
  const jakartaDate = toZonedTime(date, APP_TIMEZONE);

  // Format as datetime-local (YYYY-MM-DDTHH:mm)
  return format(jakartaDate, "yyyy-MM-dd'T'HH:mm", { timeZone: APP_TIMEZONE });
}

/**
 * Formats a UTC ISO string for display in Asia/Jakarta timezone
 *
 * @param isoString - UTC ISO string
 * @param formatString - date-fns format string (default: "dd MMM yyyy, HH:mm")
 * @returns Formatted date string in Asia/Jakarta timezone
 *
 * @example
 * formatInJakartaTime("2025-12-25T03:00:00.000Z") // Returns "25 Dec 2025, 10:00"
 */
export function formatInJakartaTime(
  isoString: string | null | undefined,
  formatString: string = "dd MMM yyyy, HH:mm"
): string {
  if (!isoString) return "";

  const date = parseISO(isoString);
  const jakartaDate = toZonedTime(date, APP_TIMEZONE);

  return format(jakartaDate, formatString, { timeZone: APP_TIMEZONE });
}

/**
 * Gets the current time in Asia/Jakarta as an ISO string
 *
 * @returns ISO string representing current time in Asia/Jakarta
 */
export function getCurrentJakartaTime(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/**
 * Checks if a date/time is in the past relative to Asia/Jakarta timezone
 *
 * @param isoString - UTC ISO string to check
 * @returns true if the date is in the past
 */
export function isPastInJakarta(isoString: string | null | undefined): boolean {
  if (!isoString) return false;

  const date = parseISO(isoString);
  const now = new Date();

  return date < now;
}

/**
 * Checks if a date/time is in the future relative to Asia/Jakarta timezone
 *
 * @param isoString - UTC ISO string to check
 * @returns true if the date is in the future
 */
export function isFutureInJakarta(isoString: string | null | undefined): boolean {
  if (!isoString) return false;

  const date = parseISO(isoString);
  const now = new Date();

  return date > now;
}
