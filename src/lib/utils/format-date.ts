// src/lib/utils/format-date.ts
// Created: Date formatting utilities for consistent date display across the admin dashboard

import {
  format,
  formatDistanceToNow,
  formatRelative,
  isValid,
  parseISO,
  isBefore,
  isAfter,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { id as localeID } from "date-fns/locale";
import { DATE_FORMATS } from "@/lib/constants";

/**
 * Parse a date string or Date object into a valid Date
 */
export function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  
  const parsed = parseISO(date);
  return isValid(parsed) ? parsed : null;
}

/**
 * Format a date for display (e.g., "25 Dec 2024")
 */
export function formatDisplayDate(
  date: string | Date | null | undefined,
  formatStr: string = DATE_FORMATS.DISPLAY
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, formatStr);
}

/**
 * Format a date with time (e.g., "25 Dec 2024, 14:30")
 */
export function formatDisplayDateTime(
  date: string | Date | null | undefined
): string {
  return formatDisplayDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
}

/**
 * Format a date for input fields (e.g., "2024-12-25")
 */
export function formatInputDate(
  date: string | Date | null | undefined
): string {
  const parsed = parseDate(date);
  if (!parsed) return "";
  return format(parsed, DATE_FORMATS.INPUT);
}

/**
 * Format a datetime for input fields (e.g., "2024-12-25T14:30")
 */
export function formatInputDateTime(
  date: string | Date | null | undefined
): string {
  const parsed = parseDate(date);
  if (!parsed) return "";
  return format(parsed, DATE_FORMATS.INPUT_WITH_TIME);
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeDate(
  date: string | Date | null | undefined,
  addSuffix: boolean = true
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return formatDistanceToNow(parsed, { addSuffix, locale: localeID });
}

/**
 * Format a date as relative with context (e.g., "today at 2:30 PM")
 */
export function formatRelativeDateTime(
  date: string | Date | null | undefined
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return formatRelative(parsed, new Date(), { locale: localeID });
}

/**
 * Get a human-friendly date label
 * Returns "Today", "Tomorrow", "Yesterday", or formatted date
 */
export function getDateLabel(date: string | Date | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  
  if (isToday(parsed)) return "Today";
  if (isTomorrow(parsed)) return "Tomorrow";
  if (isYesterday(parsed)) return "Yesterday";
  
  const daysDiff = differenceInDays(parsed, new Date());
  if (daysDiff > 0 && daysDiff <= 7) {
    return `In ${daysDiff} days`;
  }
  if (daysDiff < 0 && daysDiff >= -7) {
    return `${Math.abs(daysDiff)} days ago`;
  }
  
  return formatDisplayDate(parsed);
}

/**
 * Format a date range (e.g., "25 Dec - 31 Dec 2024")
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start && !end) return "-";
  if (!start) return `Until ${formatDisplayDate(end)}`;
  if (!end) return `From ${formatDisplayDate(start)}`;
  
  const startYear = format(start, "yyyy");
  const endYear = format(end, "yyyy");
  const startMonth = format(start, "MMM");
  const endMonth = format(end, "MMM");
  
  // Same day
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return formatDisplayDate(start);
  }
  
  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${format(start, "d")} - ${format(end, "d")} ${startMonth} ${startYear}`;
  }
  
  // Same year
  if (startYear === endYear) {
    return `${format(start, "d MMM")} - ${format(end, "d MMM")} ${startYear}`;
  }
  
  // Different years
  return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date | null | undefined): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return isBefore(parsed, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date | null | undefined): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return isAfter(parsed, new Date());
}

/**
 * Check if an event/item is currently active based on date range
 */
export function isCurrentlyActive(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): boolean {
  const now = new Date();
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  // No start date means always started
  const hasStarted = !start || isBefore(start, now) || format(start, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
  
  // No end date means never ends
  const hasNotEnded = !end || isAfter(endOfDay(end), now);
  
  return hasStarted && hasNotEnded;
}

/**
 * Get event/content status based on dates
 */
export function getDateStatus(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): "upcoming" | "ongoing" | "ended" {
  const now = new Date();
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  // Check if ended
  if (end && isBefore(endOfDay(end), now)) {
    return "ended";
  }
  
  // Check if started
  if (start && isAfter(startOfDay(start), now)) {
    return "upcoming";
  }
  
  return "ongoing";
}

/**
 * Get promotion date status (active/upcoming/ended)
 */
export function getPromotionDateStatus(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): "active" | "upcoming" | "ended" {
  const status = getDateStatus(startDate, endDate);
  return status === "ongoing" ? "active" : status;
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTime(
  date: string | Date | null | undefined
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, DATE_FORMATS.TIME_ONLY);
}

/**
 * Format date for display with optional time
 */
export function formatDate(
  date: string | Date | null | undefined,
  includeTimeOrOptions: boolean | { includeTime?: boolean } = false
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  const includeTime = typeof includeTimeOrOptions === 'boolean'
    ? includeTimeOrOptions
    : includeTimeOrOptions?.includeTime ?? false;
  return format(parsed, includeTime ? DATE_FORMATS.DISPLAY_WITH_TIME : DATE_FORMATS.DISPLAY);
}

/**
 * Format relative time (e.g., "2 hours ago", "just now")
 */
export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsed.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }
  
  return formatDisplayDate(parsed);
}
