// src/lib/validations/promotion.ts
// Created: Zod validation schemas for promotions

import { z } from "zod";
import { VALIDATION } from "@/lib/constants";

/**
 * Promotion status enum
 */
export const promotionStatusEnum = z.enum(["staging", "published", "expired"]);

/**
 * Promotion schema
 */
export const promotionSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Title must be at least ${VALIDATION.TITLE_MIN} characters`)
    .max(VALIDATION.TITLE_MAX, `Title must be less than ${VALIDATION.TITLE_MAX} characters`),
  
  tenant_id: z
    .string()
    .uuid("Please select a valid tenant"),
  
  full_description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  
  image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  source_post: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  start_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  end_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  status: promotionStatusEnum.default("staging"),
});

/**
 * Schema for creating a new promotion
 */
export const createPromotionSchema = promotionSchema;

/**
 * Schema for updating an existing promotion
 */
export const updatePromotionSchema = promotionSchema.partial().extend({
  id: z.string().uuid("Invalid promotion ID"),
});

/**
 * Schema for promotion filters
 */
export const promotionFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "staging", "published", "expired"]).optional(),
  tenantId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type PromotionFormData = z.infer<typeof promotionSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type PromotionFilters = z.infer<typeof promotionFiltersSchema>;
