// src/lib/validations/activity.ts
// Created: Zod validation schemas for activity logs

import { z } from "zod";

/**
 * Activity action types
 */
export const activityActions = [
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "login",
  "logout",
  "read",
  "bulk_read",
  "bulk_delete",
  "export",
  "import",
  "reorder",
  "toggle",
] as const;

/**
 * Activity modules
 */
export const activityModules = [
  "auth",
  "events",
  "tenants",
  "blog",
  "promotions",
  "contacts",
  "vip",
  "homepage",
  "settings",
  "users",
] as const;

/**
 * Activity log filters schema
 */
export const activityFiltersSchema = z.object({
  search: z.string().optional(),
  action: z.enum([...activityActions, "all"]).optional(),
  module: z.enum([...activityModules, "all"]).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
});

// Type exports
export type ActivityAction = (typeof activityActions)[number];
export type ActivityModule = (typeof activityModules)[number];
export type ActivityFiltersData = z.infer<typeof activityFiltersSchema>;
