// src/lib/validations/user.ts
// Created: Zod validation schemas for admin user management

import { z } from "zod";

/**
 * User status options
 */
export const userStatuses = ["active", "inactive", "pending"] as const;

/**
 * Create user schema (invitation)
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  role_ids: z
    .array(z.string().uuid())
    .min(1, "At least one role is required"),
  
  send_invitation: z.boolean().default(true),
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  avatar_url: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  is_active: z.boolean().default(true),
  
  role_ids: z
    .array(z.string().uuid())
    .min(1, "At least one role is required"),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  current_password: z
    .string()
    .min(1, "Current password is required"),
  
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

/**
 * Reset password schema (admin setting new password)
 */
export const resetPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  
  confirm_password: z.string(),
  
  send_notification: z.boolean().default(true),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

/**
 * Role schema
 */
export const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-z_]+$/, "Name must be lowercase with underscores only"),
  
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#6366f1"),
  
  is_active: z.boolean().default(true),
  
  permission_ids: z.array(z.string().uuid()).default([]),
});

/**
 * User filters schema
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", ...userStatuses]).optional(),
  roleId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
});

// Type exports
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type UserFiltersData = z.infer<typeof userFiltersSchema>;
