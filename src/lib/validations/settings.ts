// src/lib/validations/settings.ts
// Created: Zod validation schemas for site settings

import { z } from "zod";

/**
 * Setting types
 */
export const settingTypes = [
  "meta_tag",
  "script",
  "link",
  "json_ld",
  "custom_html",
] as const;

export const injectionPoints = [
  "head_start",
  "head_end",
  "body_start",
  "body_end",
] as const;

/**
 * Site setting schema
 */
export const siteSettingSchema = z.object({
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(100, "Key must be less than 100 characters")
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
  
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  value: z
    .string()
    .max(10000, "Value must be less than 10000 characters")
    .optional()
    .or(z.literal("")),
  
  setting_type: z.enum(settingTypes),
  
  injection_point: z.enum(injectionPoints),
  
  is_active: z.boolean().default(true),
  
  sort_order: z.number().int().min(0).default(0),
});

/**
 * General settings schema (stored as JSON)
 */
export const generalSettingsSchema = z.object({
  site_name: z
    .string()
    .min(2, "Site name must be at least 2 characters")
    .max(100, "Site name must be less than 100 characters"),
  
  site_tagline: z
    .string()
    .max(200, "Tagline must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  
  site_description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  logo_url: z
    .string()
    .url("Invalid logo URL")
    .optional()
    .or(z.literal("")),
  
  logo_dark_url: z
    .string()
    .url("Invalid dark logo URL")
    .optional()
    .or(z.literal("")),
  
  favicon_url: z
    .string()
    .url("Invalid favicon URL")
    .optional()
    .or(z.literal("")),
  
  default_language: z.string().default("id"),
  
  timezone: z.string().default("Asia/Jakarta"),
});

/**
 * Contact settings schema
 */
export const contactSettingsSchema = z.object({
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  
  postal_code: z
    .string()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  
  country: z.string().default("Indonesia"),
  
  phone_primary: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  
  phone_secondary: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  
  email_general: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  
  email_marketing: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  
  email_leasing: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  
  google_maps_url: z
    .string()
    .url("Invalid Google Maps URL")
    .optional()
    .or(z.literal("")),
  
  google_maps_embed: z
    .string()
    .max(2000, "Embed code must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
});

/**
 * Social media settings schema
 */
export const socialSettingsSchema = z.object({
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  twitter_url: z.string().url().optional().or(z.literal("")),
  youtube_url: z.string().url().optional().or(z.literal("")),
  tiktok_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  whatsapp_number: z.string().max(20).optional().or(z.literal("")),
});

/**
 * SEO settings schema
 */
export const seoSettingsSchema = z.object({
  meta_title: z
    .string()
    .max(70, "Meta title should be under 70 characters")
    .optional()
    .or(z.literal("")),
  
  meta_description: z
    .string()
    .max(160, "Meta description should be under 160 characters")
    .optional()
    .or(z.literal("")),
  
  meta_keywords: z
    .string()
    .max(500, "Keywords must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  og_title: z.string().max(100).optional().or(z.literal("")),
  og_description: z.string().max(300).optional().or(z.literal("")),
  og_image_url: z.string().url().optional().or(z.literal("")),
  og_type: z.string().default("website"),
  
  twitter_card: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
  twitter_site: z.string().max(50).optional().or(z.literal("")),
  twitter_creator: z.string().max(50).optional().or(z.literal("")),
  
  canonical_url: z.string().url().optional().or(z.literal("")),
  robots: z.string().default("index, follow"),
  
  google_site_verification: z.string().optional().or(z.literal("")),
  bing_site_verification: z.string().optional().or(z.literal("")),
});

/**
 * Analytics/tracking settings schema
 */
export const analyticsSettingsSchema = z.object({
  google_analytics_id: z
    .string()
    .max(50, "GA ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  google_tag_manager_id: z
    .string()
    .max(50, "GTM ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  meta_pixel_id: z
    .string()
    .max(50, "Pixel ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  tiktok_pixel_id: z
    .string()
    .max(50, "Pixel ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  
  hotjar_id: z
    .string()
    .max(50, "Hotjar ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Operating hours schema
 */
export const operatingHoursSettingsSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
  holidays: z.string().optional().or(z.literal("")),
  special_note: z.string().max(500).optional().or(z.literal("")),
});

// Type exports
export type SiteSettingFormData = z.infer<typeof siteSettingSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export type SocialSettings = z.infer<typeof socialSettingsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;
export type OperatingHoursSettings = z.infer<typeof operatingHoursSettingsSchema>;
