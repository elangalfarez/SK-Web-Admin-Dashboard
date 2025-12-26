// src/lib/validations/homepage.ts
// Created: Zod validation schemas for homepage content management

import { z } from "zod";

/**
 * Content types for What's On feed
 */
export const whatsOnContentTypes = [
  "event",
  "tenant",
  "post",
  "promotion",
  "custom",
] as const;

/**
 * What's On item schema
 */
export const whatsOnSchema = z.object({
  content_type: z.enum(whatsOnContentTypes),
  
  reference_id: z
    .string()
    .uuid("Invalid reference ID")
    .optional()
    .nullable(),
  
  custom_title: z
    .string()
    .max(100, "Title must be less than 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  custom_description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  custom_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  custom_link_url: z
    .string()
    .url("Invalid link URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  sort_order: z.number().int().min(0).default(0),
  
  is_active: z.boolean().default(true),
  
  override_start_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  override_end_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
}).refine(
  (data) => {
    // If content_type is "custom", require custom_title
    if (data.content_type === "custom") {
      return !!data.custom_title && data.custom_title.length >= 2;
    }
    // Otherwise, require reference_id
    return !!data.reference_id;
  },
  {
    message: "Custom items require a title, other types require a reference",
    path: ["content_type"],
  }
);

/**
 * Featured Restaurant schema
 */
export const featuredRestaurantSchema = z.object({
  tenant_id: z
    .string()
    .uuid("Invalid tenant ID"),
  
  featured_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  featured_description: z
    .string()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  highlight_text: z
    .string()
    .max(50, "Highlight must be less than 50 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  sort_order: z.number().int().min(0).default(0),
  
  is_active: z.boolean().default(true),
  
  start_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  end_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
});

// Type exports
export type WhatsOnFormData = z.infer<typeof whatsOnSchema>;
export type FeaturedRestaurantFormData = z.infer<typeof featuredRestaurantSchema>;
