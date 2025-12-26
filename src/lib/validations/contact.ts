// src/lib/validations/contact.ts
// Created: Zod validation schemas for contacts

import { z } from "zod";

/**
 * Enquiry types enum
 */
export const enquiryTypes = [
  "General",
  "Leasing",
  "Marketing",
  "Legal",
  "Lost & Found",
  "Parking & Security",
] as const;

export const enquiryTypeSchema = z.enum(enquiryTypes);

/**
 * Contact schema (for form submission validation)
 */
export const contactSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  
  phone_number: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  
  enquiry_type: enquiryTypeSchema,
  
  enquiry_details: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

/**
 * Admin response schema
 */
export const contactResponseSchema = z.object({
  contact_id: z.string().uuid("Invalid contact ID"),
  response_message: z
    .string()
    .min(10, "Response must be at least 10 characters")
    .max(2000, "Response must be less than 2000 characters"),
  responded_by: z.string().uuid("Invalid admin user ID"),
});

/**
 * Contact filters schema
 */
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  enquiryType: z.enum([...enquiryTypes, "all"]).optional(),
  status: z.enum(["all", "read", "unread"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactResponseData = z.infer<typeof contactResponseSchema>;
export type ContactFiltersData = z.infer<typeof contactFiltersSchema>;
