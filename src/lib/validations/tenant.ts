// src/lib/validations/tenant.ts
// Created: Zod validation schemas for tenants and categories

import { z } from "zod";

/**
 * Operating hours schema
 */
export const operatingHoursSchema = z.record(z.string(), z.string()).optional();

/**
 * Tenant schema
 */
export const tenantSchema = z.object({
  tenant_code: z
    .string()
    .min(2, "Tenant code must be at least 2 characters")
    .max(20, "Tenant code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Tenant code must be uppercase alphanumeric with dashes"),
  
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be less than 200 characters"),
  
  category_id: z
    .string()
    .uuid("Please select a valid category"),
  
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  
  main_floor: z
    .string()
    .min(1, "Please select a floor"),
  
  operating_hours: operatingHoursSchema,
  
  phone: z
    .string()
    .max(50, "Phone must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  logo_url: z.union([
    z.string().url("Invalid logo URL"),
    z.literal(""),
    z.null()
  ]).optional(),

  banner_url: z.union([
    z.string().url("Invalid banner URL"),
    z.literal(""),
    z.null()
  ]).optional(),
  
  is_active: z
    .boolean()
    .default(true),
  
  is_featured: z
    .boolean()
    .default(false),
  
  is_new_tenant: z
    .boolean()
    .default(false),
});

/**
 * Schema for creating a new tenant
 */
export const createTenantSchema = tenantSchema;

/**
 * Schema for updating an existing tenant
 */
export const updateTenantSchema = tenantSchema.partial().extend({
  id: z.string().uuid("Invalid tenant ID"),
});

/**
 * Tenant category schema
 */
export const tenantCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-z-]+$/, "Name must be lowercase with hyphens only"),
  
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters"),
  
  icon: z
    .string()
    .max(50, "Icon must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .optional()
    .or(z.literal("")),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  sort_order: z
    .number()
    .int()
    .min(0)
    .default(0),
  
  is_active: z
    .boolean()
    .default(true),
});

/**
 * Schema for tenant filters
 */
export const tenantFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  floor: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  featured: z.boolean().optional(),
  newTenant: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type TenantFormData = z.infer<typeof tenantSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantCategoryFormData = z.infer<typeof tenantCategorySchema>;
export type TenantFilters = z.infer<typeof tenantFiltersSchema>;
