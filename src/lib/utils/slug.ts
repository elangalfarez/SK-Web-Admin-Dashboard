// src/lib/utils/slug.ts
// Created: Slug generation utilities for URLs and identifiers

/**
 * Generate a URL-friendly slug from a string
 * @example generateSlug("Hello World! This is a Test") → "hello-world-this-is-a-test"
 */
export function generateSlug(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .trim()
    // Replace Indonesian characters with ASCII equivalents
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ýÿ]/g, "y")
    .replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c")
    // Remove special characters
    .replace(/[^a-z0-9\s-]/g, "")
    // Replace multiple spaces/dashes with single dash
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @example generateUniqueSlug("hello-world", ["hello-world"]) → "hello-world-1"
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(baseSlug)}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  // Slug should only contain lowercase letters, numbers, and dashes
  // Should not start or end with dash
  // Should not have consecutive dashes
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Generate a tenant code from name
 * @example generateTenantCode("Starbucks Coffee") → "STARBUCKS"
 */
export function generateTenantCode(name: string): string {
  if (!name) return "";
  
  // Take first word, uppercase, max 20 chars
  const firstWord = name.split(/\s+/)[0] || name;
  return firstWord
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
