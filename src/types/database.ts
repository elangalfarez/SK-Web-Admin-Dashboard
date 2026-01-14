// src/types/database.ts
// Created: TypeScript types for all Supabase database tables

// ============================================================================
// ADMIN USERS & AUTHENTICATION
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  module: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminRolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface AdminUserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface AdminActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface EventImage {
  url: string;
  alt: string;
  caption: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  is_published: boolean;
  is_featured: boolean;
  venue: string | null;
  images: Array<string | EventImage>; // JSONB array of image URLs or image objects
  tags: string[]; // JSONB array of tags
  summary: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, "id" | "created_at" | "updated_at">;
export type EventUpdate = Partial<EventInsert>;

// ============================================================================
// TENANTS
// ============================================================================

export interface OperatingHours {
  [key: string]: string; // e.g., "mon-sun": "10:00-22:00"
}

export interface Tenant {
  id: string;
  tenant_code: string;
  name: string;
  category_id: string;
  description: string | null;
  main_floor: string;
  operating_hours: OperatingHours | null;
  phone: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new_tenant: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TenantInsert = Omit<Tenant, "id" | "created_at" | "updated_at">;
export type TenantUpdate = Partial<TenantInsert>;

export interface TenantCategory {
  id: string;
  name: string;
  display_name: string;
  tenant_count: number;
  icon: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TenantCategoryInsert = Omit<TenantCategory, "id" | "tenant_count" | "created_at" | "updated_at">;
export type TenantCategoryUpdate = Partial<TenantCategoryInsert>;

export interface MallFloor {
  id: string;
  floor_code: string;
  floor_name: string;
  floor_number: number;
  total_tenants: number;
  viewbox: string;
  svg_background_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// BLOG
// ============================================================================

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type BlogCategoryInsert = Omit<BlogCategory, "id" | "created_at" | "updated_at">;
export type BlogCategoryUpdate = Partial<BlogCategoryInsert>;

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body_html: string | null;
  category_id: string | null;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  publish_at: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PostInsert = Omit<Post, "id" | "created_at" | "updated_at">;
export type PostUpdate = Partial<PostInsert>;

// ============================================================================
// PROMOTIONS
// ============================================================================

export type PromotionStatus = "staging" | "published" | "expired";

export interface Promotion {
  id: string;
  tenant_id: string;
  title: string;
  full_description: string | null;
  image_url: string | null;
  source_post: string | null;
  start_date: string | null;
  end_date: string | null;
  status: PromotionStatus;
  published_at: string | null;
  raw_json: Record<string, unknown>;
  created_at: string;
  media_id: string | null;
}

export type PromotionInsert = Omit<Promotion, "id" | "created_at">;
export type PromotionUpdate = Partial<PromotionInsert>;

// ============================================================================
// CONTACTS
// ============================================================================

export type EnquiryType = 
  | "General"
  | "Leasing"
  | "Marketing"
  | "Legal"
  | "Lost & Found"
  | "Parking & Security";

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  enquiry_type: EnquiryType;
  enquiry_details: string;
  submitted_date: string;
  created_at: string;
  is_read?: boolean; // Track read status (added by migration: add-contacts-is-read-column.sql)
}

// ============================================================================
// VIP CARDS
// ============================================================================

export interface VipTier {
  id: string;
  name: string;
  description: string;
  qualification_requirement: string;
  minimum_spend_amount: number;
  minimum_receipt_amount: number | null;
  tier_level: number;
  card_color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type VipTierInsert = Omit<VipTier, "id" | "created_at" | "updated_at">;
export type VipTierUpdate = Partial<VipTierInsert>;

export interface VipBenefit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type VipBenefitInsert = Omit<VipBenefit, "id" | "created_at" | "updated_at">;
export type VipBenefitUpdate = Partial<VipBenefitInsert>;

export interface VipTierBenefit {
  id: string;
  tier_id: string;
  benefit_id: string;
  benefit_note: string | null;
  display_order: number;
  created_at: string;
}

export type VipTierBenefitInsert = Omit<VipTierBenefit, "id" | "created_at">;
export type VipTierBenefitUpdate = Partial<VipTierBenefitInsert>;

// ============================================================================
// HOMEPAGE CONTENT
// ============================================================================

export type WhatsOnContentType = "event" | "tenant" | "post" | "promotion" | "custom";

export interface WhatsOn {
  id: string;
  content_type: WhatsOnContentType;
  reference_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_image_url: string | null;
  custom_link_url: string | null;
  sort_order: number;
  is_active: boolean;
  override_start_date: string | null;
  override_end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type WhatsOnInsert = Omit<WhatsOn, "id" | "created_at" | "updated_at">;
export type WhatsOnUpdate = Partial<WhatsOnInsert>;

export interface FeaturedRestaurant {
  id: string;
  tenant_id: string;
  featured_image_url: string | null;
  featured_description: string | null;
  highlight_text: string | null;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type FeaturedRestaurantInsert = Omit<FeaturedRestaurant, "id" | "created_at" | "updated_at">;
export type FeaturedRestaurantUpdate = Partial<FeaturedRestaurantInsert>;

// ============================================================================
// SITE SETTINGS
// ============================================================================

export type SiteSettingType = "meta_tag" | "script" | "link" | "json_ld" | "custom_html";
export type InjectionPoint = "head_start" | "head_end" | "body_start" | "body_end";

export interface SiteSetting {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  value: string | null;
  injection_point: InjectionPoint;
  is_active: boolean;
  setting_type: SiteSettingType;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type SiteSettingInsert = Omit<SiteSetting, "id" | "created_at" | "updated_at">;
export type SiteSettingUpdate = Partial<SiteSettingInsert>;

// ============================================================================
// VIEW TYPES (for joined/computed data)
// ============================================================================

/**
 * Admin user with their roles and permissions
 */
export interface AdminUserWithRoles extends AdminUser {
  roles: AdminRole[];
  permissions: AdminPermission[];
}

/**
 * Tenant with category information
 */
export interface TenantWithCategory extends Tenant {
  category: TenantCategory | null;
  floor: MallFloor | null;
}

/**
 * Post with category information
 */
export interface PostWithCategory extends Post {
  category: BlogCategory | null;
}

/**
 * Promotion with tenant information
 */
export interface PromotionWithTenant extends Promotion {
  tenant: Tenant | null;
}

/**
 * VIP tier with its benefits
 */
export interface VipTierWithBenefits extends VipTier {
  benefits: (VipBenefit & { benefit_note: string | null; display_order: number })[];
}

/**
 * What's On item with resolved reference data
 */
export interface WhatsOnResolved extends WhatsOn {
  reference_data?: Event | Tenant | Post | Promotion | null;
}

/**
 * Featured restaurant with tenant data
 */
export interface FeaturedRestaurantWithTenant extends FeaturedRestaurant {
  tenant: Tenant | null;
}

/**
 * Activity log with user information
 */
export interface ActivityLogWithUser extends AdminActivityLog {
  user: Pick<AdminUser, "id" | "full_name" | "email" | "avatar_url"> | null;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface EventFilters {
  search?: string;
  status?: "all" | "draft" | "published" | "expired";
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface TenantFilters {
  search?: string;
  categoryId?: string;
  floor?: string;
  status?: "all" | "active" | "inactive";
  featured?: boolean;
  isNew?: boolean;
}

export interface PostFilters {
  search?: string;
  categoryId?: string;
  status?: "all" | "draft" | "published";
  featured?: boolean;
  tags?: string[];
}

export interface PromotionFilters {
  search?: string;
  tenantId?: string;
  status?: PromotionStatus | "all";
  startDate?: string;
  endDate?: string;
}

export interface ContactFilters {
  search?: string;
  enquiryType?: EnquiryType | "all";
  startDate?: string;
  endDate?: string;
  isRead?: boolean;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  totalTenants: number;
  activeTenants: number;
  featuredTenants: number;
  totalPosts: number;
  publishedPosts: number;
  totalPromotions: number;
  activePromotions: number;
  totalContacts: number;
  unreadContacts: number;
  totalVipTiers: number;
  activeVipTiers: number;
}

export interface ContentStatsOverview {
  content_type: string;
  total_count: number;
  published_count: number;
  featured_count: number;
  upcoming_count: number;
  ongoing_count: number;
  in_whats_on_count: number;
}

export interface RecentActivity {
  activity_type: string;
  activity_title: string;
  activity_subject: string;
  activity_category: string;
  activity_date: string;
  activity_id: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface EventFormData {
  title: string;
  slug: string;
  body: string;
  summary: string;
  start_at: string;
  end_at: string;
  venue: string;
  images: Array<string | EventImage>;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
}

export interface TenantFormData {
  tenant_code: string;
  name: string;
  category_id: string;
  description: string;
  main_floor: string;
  operating_hours: OperatingHours;
  phone: string;
  logo_url: string;
  banner_url: string;
  is_active: boolean;
  is_featured: boolean;
  is_new_tenant: boolean;
}

export interface PostFormData {
  title: string;
  slug: string;
  summary: string;
  body_html: string;
  category_id: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  publish_at: string;
  image_url: string;
}

export interface PromotionFormData {
  tenant_id: string;
  title: string;
  full_description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
}
