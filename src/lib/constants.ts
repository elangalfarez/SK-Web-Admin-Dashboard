// src/lib/constants.ts
// Created: App-wide constants for Supermal Karawaci Admin Dashboard

/**
 * Application metadata
 */
export const APP_NAME = "Supermal Karawaci Admin";
export const APP_DESCRIPTION = "Admin Dashboard for managing Supermal Karawaci content";
export const APP_VERSION = "1.0.0";

/**
 * Layout dimensions (should match CSS variables)
 */
export const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_WIDTH_COLLAPSED: 72,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Date and time formats
 */
export const DATE_FORMATS = {
  DISPLAY: "dd MMM yyyy",
  DISPLAY_WITH_TIME: "dd MMM yyyy, HH:mm",
  DISPLAY_SHORT: "dd/MM/yyyy",
  INPUT: "yyyy-MM-dd",
  INPUT_WITH_TIME: "yyyy-MM-dd'T'HH:mm",
  TIME_ONLY: "HH:mm",
  RELATIVE: "relative", // For "2 hours ago" style
} as const;

/**
 * Timezone configuration
 */
export const TIMEZONE = "Asia/Jakarta";

/**
 * File upload limits
 */
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
  ACCEPTED_DOCUMENT_TYPES: ["application/pdf"] as const,
} as const;

/**
 * Supabase storage buckets
 */
export const STORAGE_BUCKETS = {
  EVENTS: "events",
  POSTS: "posts",
  PROMOTIONS: "promotions",
  TENANTS: "tenants",
  AVATARS: "avatars",
  GENERAL: "general",
} as const;

/**
 * Form validation limits
 */
export const VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 300,
  SLUG_MAX: 300,
  DESCRIPTION_MAX: 5000,
  SUMMARY_MAX: 800,
  NAME_MIN: 2,
  NAME_MAX: 255,
  EMAIL_MAX: 255,
  PHONE_MAX: 50,
  URL_MAX: 2048,
} as const;

/**
 * API request timeouts
 */
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 60000, // 60 seconds
  LONG_RUNNING: 120000, // 2 minutes
} as const;

/**
 * Toast notification durations
 */
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
  WARNING: 4000,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  SLOW: 400,
} as const;

/**
 * Debounce delays
 */
export const DEBOUNCE = {
  SEARCH: 300,
  AUTOSAVE: 30000, // 30 seconds
  RESIZE: 100,
} as const;

/**
 * Content status options
 */
export const STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  EXPIRED: "expired",
  STAGING: "staging",
} as const;

/**
 * Admin role names (should match database values)
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CONTENT_MANAGER: "content_manager",
  OPERATIONS_MANAGER: "operations_manager",
  LEASING_MANAGER: "leasing_manager",
  VIEWER: "viewer",
} as const;

/**
 * Permission modules
 */
export const PERMISSION_MODULES = {
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  EVENTS: "events",
  POSTS: "posts",
  PROMOTIONS: "promotions",
  TENANTS: "tenants",
  TENANT_CATEGORIES: "tenant_categories",
  WHATS_ON: "whats_on",
  FEATURED_RESTAURANTS: "featured_restaurants",
  CONTACTS: "contacts",
  ADMIN_USERS: "admin_users",
  ADMIN_ROLES: "admin_roles",
  SEO_SETTINGS: "seo_settings",
  ACTIVITY_LOGS: "activity_logs",
} as const;

/**
 * Permission actions
 */
export const PERMISSION_ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  PUBLISH: "publish",
  MANAGE: "manage",
  MANAGE_ROLES: "manage_roles",
  RESPOND: "respond",
  FEATURE: "feature",
} as const;

/**
 * Contact enquiry types (should match database constraint)
 */
export const ENQUIRY_TYPES = [
  "General",
  "Leasing",
  "Marketing",
  "Legal",
  "Lost & Found",
  "Parking & Security",
] as const;

/**
 * Homepage content types
 */
export const WHATS_ON_CONTENT_TYPES = [
  "event",
  "tenant",
  "post",
  "promotion",
  "custom",
] as const;

/**
 * Promotion status options
 */
export const PROMOTION_STATUS = ["staging", "published", "expired"] as const;

/**
 * VIP tier colors (default options)
 */
export const VIP_TIER_COLORS = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
  { name: "Gold", value: "#F59E0B" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Emerald", value: "#10B981" },
] as const;

/**
 * Navigation items for sidebar
 */
export const NAVIGATION = {
  MAIN: [
    { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
  ],
  CONTENT: [
    { name: "Events", href: "/events", icon: "Calendar" },
    { name: "Promotions", href: "/promotions", icon: "Tag" },
    { name: "Blog", href: "/blog", icon: "FileText" },
  ],
  HOMEPAGE: [
    { name: "What's On", href: "/whats-on", icon: "Sparkles" },
    { name: "Featured Restaurants", href: "/featured-restaurants", icon: "Utensils" },
  ],
  DIRECTORY: [
    { name: "Tenants", href: "/tenants", icon: "Building2" },
  ],
  ENGAGEMENT: [
    { name: "Contacts", href: "/contacts", icon: "Mail" },
    { name: "VIP Cards", href: "/vip-cards", icon: "CreditCard" },
  ],
  SETTINGS: [
    { name: "Site Settings", href: "/site-settings", icon: "Settings" },
    { name: "Admin Users", href: "/admin-users", icon: "Users" },
    { name: "Audit Logs", href: "/audit-logs", icon: "ScrollText" },
  ],
} as const;

/**
 * Keyboard shortcuts
 */
export const SHORTCUTS = {
  SAVE: "mod+s",
  SEARCH: "mod+k",
  NEW: "mod+n",
  CLOSE: "escape",
} as const;

/**
 * Site settings keys (should match database values)
 */
export const SITE_SETTING_KEYS = {
  SITE_TITLE: "site_title",
  SITE_DESCRIPTION: "site_description",
  OG_IMAGE: "og_image",
  GOOGLE_ANALYTICS: "google_analytics",
  META_PIXEL: "meta_pixel",
  GOOGLE_TAG_MANAGER: "google_tag_manager",
  SCHEMA_ORG: "schema_org",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  GENERIC: "Something went wrong. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  NETWORK: "Network error. Please check your connection.",
  VALIDATION: "Please check your input and try again.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: "Successfully created.",
  UPDATED: "Successfully updated.",
  DELETED: "Successfully deleted.",
  PUBLISHED: "Successfully published.",
  SAVED: "Changes saved successfully.",
} as const;

// Type exports for type safety
export type Role = typeof ROLES[keyof typeof ROLES];
export type PermissionModule = typeof PERMISSION_MODULES[keyof typeof PERMISSION_MODULES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];
export type EnquiryType = typeof ENQUIRY_TYPES[number];
export type WhatsOnContentType = typeof WHATS_ON_CONTENT_TYPES[number];
export type PromotionStatus = typeof PROMOTION_STATUS[number];
export type PageSize = typeof PAGINATION.PAGE_SIZE_OPTIONS[number];
