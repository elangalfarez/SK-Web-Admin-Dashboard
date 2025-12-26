// src/lib/validations/blog.ts
// Created: Zod validation schemas for blog posts and categories

import { z } from "zod";
import { VALIDATION } from "@/lib/constants";

/**
 * Blog post schema
 */
export const postSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Title must be at least ${VALIDATION.TITLE_MIN} characters`)
    .max(VALIDATION.TITLE_MAX, `Title must be less than ${VALIDATION.TITLE_MAX} characters`),
  
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200, "Slug must be less than 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  
  excerpt: z
    .string()
    .max(VALIDATION.SUMMARY_MAX, `Excerpt must be less than ${VALIDATION.SUMMARY_MAX} characters`)
    .optional()
    .or(z.literal("")),
  
  body: z
    .string()
    .optional()
    .or(z.literal("")),
  
  featured_image: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  category_id: z
    .string()
    .uuid("Invalid category")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  tags: z
    .array(z.string())
    .default([]),
  
  is_published: z
    .boolean()
    .default(false),
  
  is_featured: z
    .boolean()
    .default(false),
  
  published_at: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  meta_title: z
    .string()
    .max(70, "Meta title must be less than 70 characters")
    .optional()
    .or(z.literal("")),
  
  meta_description: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for creating a new post
 */
export const createPostSchema = postSchema;

/**
 * Schema for updating an existing post
 */
export const updatePostSchema = postSchema.partial().extend({
  id: z.string().uuid("Invalid post ID"),
});

/**
 * Blog category schema
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for post filters
 */
export const postFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "draft", "published"]).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type PostFormData = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type PostFilters = z.infer<typeof postFiltersSchema>;
