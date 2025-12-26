// src/lib/validations/vip.ts
// Created: Zod validation schemas for VIP tiers and benefits

import { z } from "zod";

/**
 * VIP tier schema
 */
export const vipTierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  
  qualification_requirement: z
    .string()
    .min(10, "Qualification requirement must be at least 10 characters")
    .max(1000, "Qualification requirement must be less than 1000 characters"),
  
  minimum_spend_amount: z
    .number()
    .min(0, "Minimum spend must be positive")
    .default(0),
  
  minimum_receipt_amount: z
    .number()
    .min(0, "Minimum receipt must be positive")
    .nullable()
    .optional(),
  
  tier_level: z
    .number()
    .int()
    .min(1, "Tier level must be at least 1")
    .max(10, "Tier level must be less than 10"),
  
  card_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .default("#6b7280"),
  
  is_active: z
    .boolean()
    .default(true),
  
  sort_order: z
    .number()
    .int()
    .min(0)
    .default(0),
});

/**
 * VIP benefit schema
 */
export const vipBenefitSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  icon: z
    .string()
    .max(50, "Icon must be less than 50 characters")
    .default("gift"),
  
  is_active: z
    .boolean()
    .default(true),
  
  sort_order: z
    .number()
    .int()
    .min(0)
    .default(0),
});

/**
 * VIP tier-benefit association schema
 */
export const vipTierBenefitSchema = z.object({
  tier_id: z
    .string()
    .uuid("Invalid tier ID"),
  
  benefit_id: z
    .string()
    .uuid("Invalid benefit ID"),
  
  benefit_note: z
    .string()
    .max(200, "Note must be less than 200 characters")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  display_order: z
    .number()
    .int()
    .min(0)
    .default(0),
});

/**
 * Schema for updating tier benefits (array of assignments)
 */
export const updateTierBenefitsSchema = z.object({
  tier_id: z.string().uuid("Invalid tier ID"),
  benefits: z.array(z.object({
    benefit_id: z.string().uuid("Invalid benefit ID"),
    benefit_note: z.string().max(200).optional().or(z.literal("")).or(z.null()),
    display_order: z.number().int().min(0).default(0),
  })),
});

// Type exports
export type VipTierFormData = z.infer<typeof vipTierSchema>;
export type VipBenefitFormData = z.infer<typeof vipBenefitSchema>;
export type VipTierBenefitFormData = z.infer<typeof vipTierBenefitSchema>;
export type UpdateTierBenefitsInput = z.infer<typeof updateTierBenefitsSchema>;
