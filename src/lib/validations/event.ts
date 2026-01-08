// src/lib/validations/event.ts
// Created: Zod validation schemas for event forms

import { z } from "zod";
import { VALIDATION } from "@/lib/constants";

/**
 * Base event schema with all fields
 */
export const eventSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Title must be at least ${VALIDATION.TITLE_MIN} characters`)
    .max(VALIDATION.TITLE_MAX, `Title must be less than ${VALIDATION.TITLE_MAX} characters`),
  
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200, "Slug must be less than 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  
  summary: z
    .string()
    .max(VALIDATION.SUMMARY_MAX, `Summary must be less than ${VALIDATION.SUMMARY_MAX} characters`)
    .optional()
    .or(z.literal("")),
  
  body: z
    .string()
    .optional()
    .or(z.literal("")),
  
  start_at: z
    .string()
    .min(1, "Start date is required"),
  
  end_at: z
    .string()
    .optional()
    .or(z.literal("")),
  
  venue: z
    .string()
    .max(200, "Venue must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  
  images: z
    .array(
      z.union([
        z.string().url("Invalid image URL"), // Support legacy string format
        z.object({
          url: z.string().url("Invalid image URL"),
          alt: z.string().optional(),
          caption: z.string().optional(),
        }),
      ])
    )
    .default([]),
  
  tags: z
    .array(z.string())
    .default([]),
  
  is_published: z
    .boolean()
    .default(false),
  
  is_featured: z
    .boolean()
    .default(false),
});

/**
 * Schema for creating a new event
 */
export const createEventSchema = eventSchema;

/**
 * Schema for updating an existing event
 */
export const updateEventSchema = eventSchema.partial().extend({
  id: z.string().uuid("Invalid event ID"),
});

/**
 * Schema for event filters
 */
export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "draft", "published", "upcoming", "ongoing", "ended"]).optional(),
  featured: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type EventFormData = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilters = z.infer<typeof eventFiltersSchema>;
