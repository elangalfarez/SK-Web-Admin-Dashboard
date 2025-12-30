// src/actions/settings.ts
// Created: Server actions for site settings management

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import {
  siteSettingSchema,
  generalSettingsSchema,
  contactSettingsSchema,
  socialSettingsSchema,
  seoSettingsSchema,
  analyticsSettingsSchema,
  operatingHoursSettingsSchema,
} from "@/lib/validations/settings";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { SiteSetting, SiteSettingType, InjectionPoint } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsGroup {
  key: string;
  name: string;
  description: string;
  settings: Record<string, any>;
}

// Setting group keys (stored as special site_settings rows)
const SETTINGS_GROUPS = {
  GENERAL: "settings_general",
  CONTACT: "settings_contact",
  SOCIAL: "settings_social",
  SEO: "settings_seo",
  ANALYTICS: "settings_analytics",
  OPERATING_HOURS: "settings_operating_hours",
} as const;

// ============================================================================
// GET ALL SITE SETTINGS
// ============================================================================

export async function getSiteSettings(): Promise<ActionResult<SiteSetting[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get site settings error:", error);
    return errorResponse("Failed to fetch site settings");
  }
}

// ============================================================================
// GET SINGLE SITE SETTING
// ============================================================================

export async function getSiteSetting(id: string): Promise<ActionResult<SiteSetting>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error("Get site setting error:", error);
    return errorResponse("Failed to fetch site setting");
  }
}

// ============================================================================
// GET SETTING BY KEY
// ============================================================================

export async function getSettingByKey(key: string): Promise<ActionResult<SiteSetting | null>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", key)
      .single();

    if (error && error.code !== "PGRST116") {
      return handleSupabaseError(error);
    }

    return successResponse(data || null);
  } catch (error) {
    console.error("Get setting by key error:", error);
    return errorResponse("Failed to fetch setting");
  }
}

// ============================================================================
// CREATE SITE SETTING
// ============================================================================

export async function createSiteSetting(
  formData: FormData
): Promise<ActionResult<SiteSetting>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      key: formData.get("key") as string,
      display_name: formData.get("display_name") as string,
      description: formData.get("description") as string || "",
      value: formData.get("value") as string || "",
      setting_type: formData.get("setting_type") as SiteSettingType,
      injection_point: formData.get("injection_point") as InjectionPoint,
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = siteSettingSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate key
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", data.key)
      .single();

    if (existing) {
      return errorResponse("A setting with this key already exists");
    }

    // Insert setting
    const { data: setting, error } = await supabase
      .from("site_settings")
      .insert({
        ...data,
        created_by: session.userId,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "settings", {
      resourceType: "site_setting",
      resourceId: setting.id,
      resourceName: setting.display_name,
    });

    revalidatePath("/settings");

    return successResponse(setting, "Setting created successfully");
  } catch (error) {
    console.error("Create site setting error:", error);
    return errorResponse("Failed to create setting");
  }
}

// ============================================================================
// UPDATE SITE SETTING
// ============================================================================

export async function updateSiteSetting(
  id: string,
  formData: FormData
): Promise<ActionResult<SiteSetting>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      key: formData.get("key") as string,
      display_name: formData.get("display_name") as string,
      description: formData.get("description") as string || "",
      value: formData.get("value") as string || "",
      setting_type: formData.get("setting_type") as SiteSettingType,
      injection_point: formData.get("injection_point") as InjectionPoint,
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = siteSettingSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate key if changed
    const { data: currentSetting } = await supabase
      .from("site_settings")
      .select("key")
      .eq("id", id)
      .single();

    if (currentSetting && currentSetting.key !== data.key) {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", data.key)
        .single();

      if (existing) {
        return errorResponse("A setting with this key already exists");
      }
    }

    // Update setting
    const { data: setting, error } = await supabase
      .from("site_settings")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "settings", {
      resourceType: "site_setting",
      resourceId: setting.id,
      resourceName: setting.display_name,
    });

    revalidatePath("/settings");

    return successResponse(setting, "Setting updated successfully");
  } catch (error) {
    console.error("Update site setting error:", error);
    return errorResponse("Failed to update setting");
  }
}

// ============================================================================
// DELETE SITE SETTING
// ============================================================================

export async function deleteSiteSetting(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get setting for logging
    const { data: setting } = await supabase
      .from("site_settings")
      .select("display_name, key")
      .eq("id", id)
      .single();

    if (!setting) {
      return errorResponse("Setting not found");
    }

    // Prevent deletion of core settings
    if (setting.key.startsWith("settings_")) {
      return errorResponse("Cannot delete core settings");
    }

    // Delete setting
    const { error } = await supabase
      .from("site_settings")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "settings", {
      resourceType: "site_setting",
      resourceId: id,
      resourceName: setting.display_name,
    });

    revalidatePath("/settings");

    return successResponse(undefined, "Setting deleted successfully");
  } catch (error) {
    console.error("Delete site setting error:", error);
    return errorResponse("Failed to delete setting");
  }
}

// ============================================================================
// TOGGLE SETTING STATUS
// ============================================================================

export async function toggleSettingStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<SiteSetting>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: setting, error } = await supabase
      .from("site_settings")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    revalidatePath("/settings");

    return successResponse(setting, isActive ? "Setting enabled" : "Setting disabled");
  } catch (error) {
    console.error("Toggle setting status error:", error);
    return errorResponse("Failed to update setting");
  }
}

// ============================================================================
// GET SETTINGS GROUP (for grouped settings like general, contact, etc.)
// ============================================================================

export async function getSettingsGroup<T>(
  groupKey: string,
  defaultValues: T
): Promise<ActionResult<T>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", groupKey)
      .single();

    if (error && error.code !== "PGRST116") {
      return handleSupabaseError(error);
    }

    if (!data?.value) {
      return successResponse(defaultValues);
    }

    try {
      const parsed = JSON.parse(data.value);
      return successResponse({ ...defaultValues, ...parsed });
    } catch {
      return successResponse(defaultValues);
    }
  } catch (error) {
    console.error("Get settings group error:", error);
    return errorResponse("Failed to fetch settings");
  }
}

// ============================================================================
// SAVE SETTINGS GROUP
// ============================================================================

export async function saveSettingsGroup(
  groupKey: string,
  displayName: string,
  values: Record<string, any>
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();
    const jsonValue = JSON.stringify(values);

    // Upsert the setting
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key: groupKey,
          display_name: displayName,
          description: `${displayName} configuration`,
          value: jsonValue,
          setting_type: "json_ld" as SiteSettingType,
          injection_point: "head_end" as InjectionPoint,
          is_active: true,
          sort_order: 0,
          created_by: session.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "settings", {
      resourceType: "settings_group",
      resourceId: groupKey,
      resourceName: displayName,
    });

    revalidatePath("/settings");

    return successResponse(undefined, "Settings saved successfully");
  } catch (error) {
    console.error("Save settings group error:", error);
    return errorResponse("Failed to save settings");
  }
}

// ============================================================================
// SPECIFIC SETTINGS GETTERS
// ============================================================================

export async function getGeneralSettings() {
  const defaults = {
    site_name: "Supermal Karawaci",
    site_tagline: "",
    site_description: "",
    logo_url: "",
    logo_dark_url: "",
    favicon_url: "",
    default_language: "id",
    timezone: "Asia/Jakarta",
  };
  return getSettingsGroup(SETTINGS_GROUPS.GENERAL, defaults);
}

export async function getContactSettings() {
  const defaults = {
    address: "",
    city: "Tangerang",
    postal_code: "",
    country: "Indonesia",
    phone_primary: "",
    phone_secondary: "",
    email_general: "",
    email_marketing: "",
    email_leasing: "",
    google_maps_url: "",
    google_maps_embed: "",
    latitude: "",
    longitude: "",
  };
  return getSettingsGroup(SETTINGS_GROUPS.CONTACT, defaults);
}

export async function getSocialSettings() {
  const defaults = {
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
    linkedin_url: "",
    whatsapp_number: "",
  };
  return getSettingsGroup(SETTINGS_GROUPS.SOCIAL, defaults);
}

export async function getSeoSettings() {
  const defaults = {
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    og_type: "website",
    twitter_card: "summary_large_image",
    twitter_site: "",
    twitter_creator: "",
    canonical_url: "",
    robots: "index, follow",
    google_site_verification: "",
    bing_site_verification: "",
  };
  return getSettingsGroup(SETTINGS_GROUPS.SEO, defaults);
}

export async function getAnalyticsSettings() {
  const defaults = {
    google_analytics_id: "",
    google_tag_manager_id: "",
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    hotjar_id: "",
  };
  return getSettingsGroup(SETTINGS_GROUPS.ANALYTICS, defaults);
}

export async function getOperatingHoursSettings() {
  const defaultHours = { open: "10:00", close: "22:00", closed: false };
  const defaults = {
    monday: { ...defaultHours },
    tuesday: { ...defaultHours },
    wednesday: { ...defaultHours },
    thursday: { ...defaultHours },
    friday: { ...defaultHours },
    saturday: { ...defaultHours },
    sunday: { ...defaultHours },
    holidays: "",
    special_note: "",
  };
  return getSettingsGroup(SETTINGS_GROUPS.OPERATING_HOURS, defaults);
}

// ============================================================================
// SPECIFIC SETTINGS SAVERS
// ============================================================================

export async function saveGeneralSettings(values: Record<string, any>) {
  const validated = generalSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.GENERAL, "General Settings", validated.data);
}

export async function saveContactSettings(values: Record<string, any>) {
  const validated = contactSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.CONTACT, "Contact Settings", validated.data);
}

export async function saveSocialSettings(values: Record<string, any>) {
  const validated = socialSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.SOCIAL, "Social Settings", validated.data);
}

export async function saveSeoSettings(values: Record<string, any>) {
  const validated = seoSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.SEO, "SEO Settings", validated.data);
}

export async function saveAnalyticsSettings(values: Record<string, any>) {
  const validated = analyticsSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.ANALYTICS, "Analytics Settings", validated.data);
}

export async function saveOperatingHoursSettings(values: Record<string, any>) {
  const validated = operatingHoursSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }
  return saveSettingsGroup(SETTINGS_GROUPS.OPERATING_HOURS, "Operating Hours", validated.data);
}

// ============================================================================
// GET SCRIPTS FOR INJECTION (used by frontend)
// ============================================================================

export async function getActiveScripts(
  injectionPoint: InjectionPoint
): Promise<ActionResult<SiteSetting[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("injection_point", injectionPoint)
      .eq("is_active", true)
      .not("key", "like", "settings_%")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get active scripts error:", error);
    return errorResponse("Failed to fetch scripts");
  }
}
