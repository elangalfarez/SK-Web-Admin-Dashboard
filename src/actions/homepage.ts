// src/actions/homepage.ts
// Created: Server actions for homepage content management (What's On, Featured Restaurants)

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { whatsOnSchema, featuredRestaurantSchema } from "@/lib/validations/homepage";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type {
  WhatsOn,
  WhatsOnContentType,
  FeaturedRestaurant,
  Tenant,
} from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsOnResolved extends WhatsOn {
  reference_data?: {
    id: string;
    title?: string;
    name?: string;
    image_url?: string;
    logo_url?: string;
  } | null;
}

export interface FeaturedRestaurantWithTenant extends FeaturedRestaurant {
  tenant: Pick<Tenant, "id" | "name" | "logo_url" | "category_id"> | null;
}

// ============================================================================
// WHAT'S ON - GET ALL
// ============================================================================

export async function getWhatsOnItems(): Promise<ActionResult<WhatsOnResolved[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("whats_on")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    // Resolve reference data for each item
    const resolvedItems: WhatsOnResolved[] = [];

    for (const item of data || []) {
      let reference_data = null;

      if (item.reference_id && item.content_type !== "custom") {
        const table = getTableForContentType(item.content_type);
        if (table) {
          // Select correct columns based on content type
          const selectCols = item.content_type === "event"
            ? "id, title, images"
            : item.content_type === "tenant"
            ? "id, name, logo_url"
            : "id, title, image_url";

          const { data: refData } = await supabase
            .from(table)
            .select(selectCols)
            .eq("id", item.reference_id)
            .single();

          if (refData) {
            // Normalize the data structure - cast to any since select columns vary by content type
            const data = refData as Record<string, unknown>;
            reference_data = {
              id: data.id as string,
              title: data.title as string | undefined,
              name: data.name as string | undefined,
              image_url: (data.image_url || data.logo_url || ((data.images as string[] | undefined)?.[0] ?? null)) as string | undefined,
              logo_url: data.logo_url as string | undefined,
            };
          }
        }
      }

      resolvedItems.push({ ...item, reference_data });
    }

    return successResponse(resolvedItems);
  } catch (error) {
    console.error("Get What's On items error:", error);
    return errorResponse("Failed to fetch What's On items");
  }
}

// ============================================================================
// WHAT'S ON - GET SINGLE
// ============================================================================

export async function getWhatsOnItem(id: string): Promise<ActionResult<WhatsOnResolved>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("whats_on")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    let reference_data = null;
    if (data.reference_id && data.content_type !== "custom") {
      const table = getTableForContentType(data.content_type);
      if (table) {
        // Select correct columns based on content type
        const selectCols = data.content_type === "event"
          ? "id, title, images"
          : data.content_type === "tenant"
          ? "id, name, logo_url"
          : "id, title, image_url";

        const { data: refData } = await supabase
          .from(table)
          .select(selectCols)
          .eq("id", data.reference_id)
          .single();

        if (refData) {
          // Normalize the data structure - cast to any since select columns vary by content type
          const data = refData as Record<string, unknown>;
          reference_data = {
            id: data.id as string,
            title: data.title as string | undefined,
            name: data.name as string | undefined,
            image_url: (data.image_url || data.logo_url || ((data.images as string[] | undefined)?.[0] ?? null)) as string | undefined,
            logo_url: data.logo_url as string | undefined,
          };
        }
      }
    }

    return successResponse({ ...data, reference_data });
  } catch (error) {
    console.error("Get What's On item error:", error);
    return errorResponse("Failed to fetch What's On item");
  }
}

// ============================================================================
// WHAT'S ON - CREATE
// ============================================================================

export async function createWhatsOnItem(
  formData: FormData
): Promise<ActionResult<WhatsOn>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      content_type: formData.get("content_type") as WhatsOnContentType,
      reference_id: formData.get("reference_id") as string || null,
      custom_title: formData.get("custom_title") as string || null,
      custom_description: formData.get("custom_description") as string || null,
      custom_image_url: formData.get("custom_image_url") as string || null,
      custom_link_url: formData.get("custom_link_url") as string || null,
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
      override_start_date: formData.get("override_start_date") as string || null,
      override_end_date: formData.get("override_end_date") as string || null,
    };

    // Validate
    const validated = whatsOnSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Insert item
    const { data: item, error } = await supabase
      .from("whats_on")
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
    await logActivity(session.userId, "create", "homepage", {
      resourceType: "whats_on",
      resourceId: item.id,
      resourceName: item.custom_title || `${item.content_type} reference`,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/whats-on");

    return successResponse(item, "What's On item created successfully");
  } catch (error) {
    console.error("Create What's On item error:", error);
    return errorResponse("Failed to create What's On item");
  }
}

// ============================================================================
// WHAT'S ON - UPDATE
// ============================================================================

export async function updateWhatsOnItem(
  id: string,
  formData: FormData
): Promise<ActionResult<WhatsOn>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      content_type: formData.get("content_type") as WhatsOnContentType,
      reference_id: formData.get("reference_id") as string || null,
      custom_title: formData.get("custom_title") as string || null,
      custom_description: formData.get("custom_description") as string || null,
      custom_image_url: formData.get("custom_image_url") as string || null,
      custom_link_url: formData.get("custom_link_url") as string || null,
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
      override_start_date: formData.get("override_start_date") as string || null,
      override_end_date: formData.get("override_end_date") as string || null,
    };

    // Validate
    const validated = whatsOnSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Update item
    const { data: item, error } = await supabase
      .from("whats_on")
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
    await logActivity(session.userId, "update", "homepage", {
      resourceType: "whats_on",
      resourceId: item.id,
      resourceName: item.custom_title || `${item.content_type} reference`,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/whats-on");

    return successResponse(item, "What's On item updated successfully");
  } catch (error) {
    console.error("Update What's On item error:", error);
    return errorResponse("Failed to update What's On item");
  }
}

// ============================================================================
// WHAT'S ON - DELETE
// ============================================================================

export async function deleteWhatsOnItem(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get item for logging
    const { data: item } = await supabase
      .from("whats_on")
      .select("custom_title, content_type")
      .eq("id", id)
      .single();

    if (!item) {
      return errorResponse("Item not found");
    }

    // Delete item
    const { error } = await supabase
      .from("whats_on")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "homepage", {
      resourceType: "whats_on",
      resourceId: id,
      resourceName: item.custom_title || `${item.content_type} reference`,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/whats-on");

    return successResponse(undefined, "What's On item deleted successfully");
  } catch (error) {
    console.error("Delete What's On item error:", error);
    return errorResponse("Failed to delete What's On item");
  }
}

// ============================================================================
// WHAT'S ON - REORDER
// ============================================================================

export async function reorderWhatsOnItems(
  items: { id: string; sort_order: number }[]
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Update each item's sort order
    for (const item of items) {
      const { error } = await supabase
        .from("whats_on")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);

      if (error) {
        return handleSupabaseError(error);
      }
    }

    revalidatePath("/homepage");
    revalidatePath("/homepage/whats-on");

    return successResponse(undefined, "Order updated successfully");
  } catch (error) {
    console.error("Reorder What's On items error:", error);
    return errorResponse("Failed to reorder items");
  }
}

// ============================================================================
// WHAT'S ON - TOGGLE STATUS
// ============================================================================

export async function toggleWhatsOnStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<WhatsOn>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: item, error } = await supabase
      .from("whats_on")
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

    revalidatePath("/homepage");
    revalidatePath("/homepage/whats-on");

    return successResponse(item, isActive ? "Item enabled" : "Item disabled");
  } catch (error) {
    console.error("Toggle What's On status error:", error);
    return errorResponse("Failed to update item");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - GET ALL
// ============================================================================

export async function getFeaturedRestaurants(): Promise<ActionResult<FeaturedRestaurantWithTenant[]>> {
  try {
    const supabase = await createClient();

    // Fetch featured restaurants without join (no FK relationship may exist)
    const { data: restaurants, error } = await supabase
      .from("featured_restaurants")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch tenants separately
    const tenantIds = [...new Set((restaurants || []).map(r => r.tenant_id).filter(Boolean))];
    let tenantsMap: Record<string, { id: string; name: string; logo_url: string | null; category_id: string | null }> = {};

    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, logo_url, category_id")
        .in("id", tenantIds);

      if (tenants) {
        tenantsMap = tenants.reduce((acc, tenant) => {
          acc[tenant.id] = tenant;
          return acc;
        }, {} as typeof tenantsMap);
      }
    }

    // Merge with tenant data
    const restaurantsWithTenant: FeaturedRestaurantWithTenant[] = (restaurants || []).map(restaurant => ({
      ...restaurant,
      tenant: restaurant.tenant_id ? tenantsMap[restaurant.tenant_id] || null : null,
    }));

    return successResponse(restaurantsWithTenant);
  } catch (error) {
    console.error("Get featured restaurants error:", error);
    return errorResponse("Failed to fetch featured restaurants");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - GET SINGLE
// ============================================================================

export async function getFeaturedRestaurant(
  id: string
): Promise<ActionResult<FeaturedRestaurantWithTenant>> {
  try {
    const supabase = await createClient();

    // Fetch featured restaurant without join (no FK relationship may exist)
    const { data: restaurant, error } = await supabase
      .from("featured_restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch tenant separately
    let tenant: { id: string; name: string; logo_url: string | null; category_id: string | null } | null = null;
    if (restaurant.tenant_id) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, logo_url, category_id")
        .eq("id", restaurant.tenant_id)
        .single();

      tenant = tenantData;
    }

    return successResponse({
      ...restaurant,
      tenant,
    } as FeaturedRestaurantWithTenant);
  } catch (error) {
    console.error("Get featured restaurant error:", error);
    return errorResponse("Failed to fetch featured restaurant");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - CREATE
// ============================================================================

export async function createFeaturedRestaurant(
  formData: FormData
): Promise<ActionResult<FeaturedRestaurant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      tenant_id: formData.get("tenant_id") as string,
      featured_image_url: formData.get("featured_image_url") as string || null,
      featured_description: formData.get("featured_description") as string || null,
      highlight_text: formData.get("highlight_text") as string || null,
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
      start_date: formData.get("start_date") as string || null,
      end_date: formData.get("end_date") as string || null,
    };

    // Validate
    const validated = featuredRestaurantSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if tenant is already featured
    const { data: existing } = await supabase
      .from("featured_restaurants")
      .select("id")
      .eq("tenant_id", data.tenant_id)
      .single();

    if (existing) {
      return errorResponse("This restaurant is already featured");
    }

    // Insert item
    const { data: item, error } = await supabase
      .from("featured_restaurants")
      .insert({
        ...data,
        created_by: session.userId,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Get tenant name for logging
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", data.tenant_id)
      .single();

    // Log activity
    await logActivity(session.userId, "create", "homepage", {
      resourceType: "featured_restaurant",
      resourceId: item.id,
      resourceName: tenant?.name || data.tenant_id,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/restaurants");

    return successResponse(item, "Featured restaurant added successfully");
  } catch (error) {
    console.error("Create featured restaurant error:", error);
    return errorResponse("Failed to add featured restaurant");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - UPDATE
// ============================================================================

export async function updateFeaturedRestaurant(
  id: string,
  formData: FormData
): Promise<ActionResult<FeaturedRestaurant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      tenant_id: formData.get("tenant_id") as string,
      featured_image_url: formData.get("featured_image_url") as string || null,
      featured_description: formData.get("featured_description") as string || null,
      highlight_text: formData.get("highlight_text") as string || null,
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
      start_date: formData.get("start_date") as string || null,
      end_date: formData.get("end_date") as string || null,
    };

    // Validate
    const validated = featuredRestaurantSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if changing tenant and if new tenant is already featured
    const { data: currentItem } = await supabase
      .from("featured_restaurants")
      .select("tenant_id")
      .eq("id", id)
      .single();

    if (currentItem && currentItem.tenant_id !== data.tenant_id) {
      const { data: existing } = await supabase
        .from("featured_restaurants")
        .select("id")
        .eq("tenant_id", data.tenant_id)
        .single();

      if (existing) {
        return errorResponse("This restaurant is already featured");
      }
    }

    // Update item
    const { data: item, error } = await supabase
      .from("featured_restaurants")
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

    // Get tenant name for logging
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", data.tenant_id)
      .single();

    // Log activity
    await logActivity(session.userId, "update", "homepage", {
      resourceType: "featured_restaurant",
      resourceId: item.id,
      resourceName: tenant?.name || data.tenant_id,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/restaurants");

    return successResponse(item, "Featured restaurant updated successfully");
  } catch (error) {
    console.error("Update featured restaurant error:", error);
    return errorResponse("Failed to update featured restaurant");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - DELETE
// ============================================================================

export async function deleteFeaturedRestaurant(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get item for logging (without join)
    const { data: item } = await supabase
      .from("featured_restaurants")
      .select("tenant_id")
      .eq("id", id)
      .single();

    if (!item) {
      return errorResponse("Item not found");
    }

    // Get tenant name for logging
    let tenantName = item.tenant_id;
    if (item.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", item.tenant_id)
        .single();
      tenantName = tenant?.name || item.tenant_id;
    }

    // Delete item
    const { error } = await supabase
      .from("featured_restaurants")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "homepage", {
      resourceType: "featured_restaurant",
      resourceId: id,
      resourceName: tenantName,
    });

    revalidatePath("/homepage");
    revalidatePath("/homepage/restaurants");

    return successResponse(undefined, "Featured restaurant removed successfully");
  } catch (error) {
    console.error("Delete featured restaurant error:", error);
    return errorResponse("Failed to remove featured restaurant");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - REORDER
// ============================================================================

export async function reorderFeaturedRestaurants(
  items: { id: string; sort_order: number }[]
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Update each item's sort order
    for (const item of items) {
      const { error } = await supabase
        .from("featured_restaurants")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);

      if (error) {
        return handleSupabaseError(error);
      }
    }

    revalidatePath("/homepage");
    revalidatePath("/homepage/restaurants");

    return successResponse(undefined, "Order updated successfully");
  } catch (error) {
    console.error("Reorder featured restaurants error:", error);
    return errorResponse("Failed to reorder items");
  }
}

// ============================================================================
// FEATURED RESTAURANTS - TOGGLE STATUS
// ============================================================================

export async function toggleFeaturedRestaurantStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<FeaturedRestaurant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: item, error } = await supabase
      .from("featured_restaurants")
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

    revalidatePath("/homepage");
    revalidatePath("/homepage/restaurants");

    return successResponse(item, isActive ? "Item enabled" : "Item disabled");
  } catch (error) {
    console.error("Toggle featured restaurant status error:", error);
    return errorResponse("Failed to update item");
  }
}

// ============================================================================
// HELPERS - Get reference options for content type
// ============================================================================

export async function getReferenceOptions(
  contentType: WhatsOnContentType
): Promise<ActionResult<{ id: string; label: string; image?: string }[]>> {
  try {
    const supabase = await createClient();
    const table = getTableForContentType(contentType);

    if (!table) {
      return successResponse([]);
    }

    let query;
    switch (contentType) {
      case "event":
        query = supabase
          .from("events")
          .select("id, title, images")
          .eq("is_published", true)
          .order("start_at", { ascending: false })
          .limit(50);
        break;
      case "tenant":
        query = supabase
          .from("tenants")
          .select("id, name, logo_url")
          .eq("is_active", true)
          .order("name", { ascending: true })
          .limit(100);
        break;
      case "post":
        query = supabase
          .from("posts")
          .select("id, title, image_url")
          .eq("is_published", true)
          .order("publish_at", { ascending: false })
          .limit(50);
        break;
      case "promotion":
        query = supabase
          .from("promotions")
          .select("id, title, image_url")
          .eq("status", "published")
          .order("start_date", { ascending: false })
          .limit(50);
        break;
      default:
        return successResponse([]);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    const options = (data || []).map((item: any) => ({
      id: item.id,
      label: item.title || item.name,
      image: item.image_url || item.logo_url || (item.images?.[0] ?? null),
    }));

    return successResponse(options);
  } catch (error) {
    console.error("Get reference options error:", error);
    return errorResponse("Failed to fetch options");
  }
}

// ============================================================================
// HELPERS - Get restaurant options for featured selection
// ============================================================================

export async function getRestaurantOptions(): Promise<
  ActionResult<{ id: string; name: string; logo_url: string | null }[]>
> {
  try {
    const supabase = await createClient();

    // Get food & beverage category IDs first
    const { data: categories } = await supabase
      .from("tenant_categories")
      .select("id")
      .or("name.ilike.%food%,name.ilike.%restaurant%,name.ilike.%cafe%,name.ilike.%dining%,name.ilike.%f&b%");

    const categoryIds = (categories || []).map((c) => c.id);

    // Get active tenants in F&B categories
    let query = supabase
      .from("tenants")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (categoryIds.length > 0) {
      query = query.in("category_id", categoryIds);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get restaurant options error:", error);
    return errorResponse("Failed to fetch restaurant options");
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function getTableForContentType(contentType: WhatsOnContentType): string | null {
  const tableMap: Record<WhatsOnContentType, string | null> = {
    event: "events",
    tenant: "tenants",
    post: "posts",
    promotion: "promotions",
    custom: null,
  };
  return tableMap[contentType];
}
