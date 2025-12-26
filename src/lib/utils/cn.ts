// src/lib/utils/cn.ts
// Created: Class name utility combining clsx and tailwind-merge for proper class merging

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for optimal class name handling
 * - clsx: Handles conditional classes, arrays, objects
 * - twMerge: Resolves Tailwind class conflicts (e.g., "px-2 px-4" → "px-4")
 * 
 * @example
 * cn("px-2 py-1", isActive && "bg-primary", { "text-white": isActive })
 * // Returns: "px-2 py-1 bg-primary text-white" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a variant class generator for component variants
 * Useful for creating consistent variant patterns
 * 
 * @example
 * const buttonVariants = createVariants({
 *   base: "px-4 py-2 rounded",
 *   variants: {
 *     primary: "bg-primary text-primary-foreground",
 *     secondary: "bg-secondary text-secondary-foreground",
 *   },
 *   defaultVariant: "primary"
 * })
 * buttonVariants("secondary") // Returns merged classes
 */
export function createVariants<T extends string>(config: {
  base: string;
  variants: Record<T, string>;
  defaultVariant: T;
}) {
  return (variant?: T, additionalClasses?: string) => {
    const selectedVariant = variant || config.defaultVariant;
    return cn(
      config.base,
      config.variants[selectedVariant],
      additionalClasses
    );
  };
}
