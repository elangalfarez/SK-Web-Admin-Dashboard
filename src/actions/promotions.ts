// src/actions/promotions.ts
// Created: Server actions for promotions CRUD operations

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { createPromotionSchema, updatePromotionSchema, type PromotionFilters } from "@/lib/validations/promotion";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { Promotion, PromotionWithTenant, Tenant, PaginatedResult } from "@/types/database";

// ============================================================================
// GET PROMOTIONS (with pagination and filters)
// ============================================================================

export async function getPromotions(
  filters: PromotionFilters = { page: 1, perPage: 10 }
): Promise<ActionResult<PaginatedResult<PromotionWithTenant>>> {
  try {
    const supabase = await createClient();
    const { page, perPage, search, status, tenantId, startDate, endDate, sortBy, sortOrder } = filters;

    // Build query - fetch promotions without join (no FK relationship exists)
    let query = supabase
      .from("promotions")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,full_description.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (startDate) {
      query = query.gte("start_date", startDate);
    }

    if (endDate) {
      query = query.lte("end_date", endDate);
    }

    // Apply sorting
    const orderColumn = sortBy || "created_at";
    const orderDirection = sortOrder === "asc" ? true : false;
    query = query.order(orderColumn, { ascending: orderDirection });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: promotions, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch tenants separately for the promotions
    const tenantIds = [...new Set((promotions || []).map(p => p.tenant_id).filter(Boolean))];
    let tenantsMap: Record<string, Tenant> = {};

    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, tenant_code, logo_url, category_id")
        .in("id", tenantIds);

      if (tenants) {
        tenantsMap = tenants.reduce((acc, tenant) => {
          acc[tenant.id] = tenant as Tenant;
          return acc;
        }, {} as Record<string, Tenant>);
      }
    }

    // Merge promotions with tenant data
    const promotionsWithTenant: PromotionWithTenant[] = (promotions || []).map(promotion => ({
      ...promotion,
      tenant: tenantsMap[promotion.tenant_id] || null,
    }));

    return successResponse({
      data: promotionsWithTenant,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get promotions error:", error);
    return errorResponse("Failed to fetch promotions");
  }
}

// ============================================================================
// GET SINGLE PROMOTION
// ============================================================================

export async function getPromotion(id: string): Promise<ActionResult<PromotionWithTenant>> {
  try {
    const supabase = await createClient();

    // Fetch promotion without join (no FK relationship exists)
    const { data: promotion, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch tenant separately
    let tenant: Tenant | null = null;
    if (promotion.tenant_id) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, tenant_code, logo_url, category_id, main_floor")
        .eq("id", promotion.tenant_id)
        .single();

      tenant = tenantData as Tenant | null;
    }

    return successResponse({
      ...promotion,
      tenant,
    } as PromotionWithTenant);
  } catch (error) {
    console.error("Get promotion error:", error);
    return errorResponse("Failed to fetch promotion");
  }
}

// ============================================================================
// CREATE PROMOTION
// ============================================================================

export async function createPromotion(
  formData: FormData
): Promise<ActionResult<Promotion>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      title: formData.get("title") as string,
      tenant_id: formData.get("tenant_id") as string,
      full_description: formData.get("full_description") as string || "",
      image_url: formData.get("image_url") as string || null,
      source_post: formData.get("source_post") as string || null,
      start_date: formData.get("start_date") as string || null,
      end_date: formData.get("end_date") as string || null,
      status: formData.get("status") as "staging" | "published" | "expired",
    };

    // Validate
    const validated = createPromotionSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Set published_at if publishing
    let publishedAt: string | null = null;
    if (data.status === "published") {
      publishedAt = new Date().toISOString();
    }

    // Insert promotion
    const { data: promotion, error } = await supabase
      .from("promotions")
      .insert({
        title: data.title,
        tenant_id: data.tenant_id,
        full_description: data.full_description || null,
        image_url: data.image_url || null,
        source_post: data.source_post || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        status: data.status,
        published_at: publishedAt,
        raw_json: {},
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "promotions", {
      resourceType: "promotion",
      resourceId: promotion.id,
      resourceName: promotion.title,
      newValues: { title: promotion.title, status: promotion.status },
    });

    // Revalidate pages
    revalidatePath("/promotions");
    revalidatePath("/");

    return successResponse(promotion, "Promotion created successfully");
  } catch (error) {
    console.error("Create promotion error:", error);
    return errorResponse("Failed to create promotion");
  }
}

// ============================================================================
// UPDATE PROMOTION
// ============================================================================

export async function updatePromotion(
  id: string,
  formData: FormData
): Promise<ActionResult<Promotion>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      id,
      title: formData.get("title") as string,
      tenant_id: formData.get("tenant_id") as string,
      full_description: formData.get("full_description") as string || "",
      image_url: formData.get("image_url") as string || null,
      source_post: formData.get("source_post") as string || null,
      start_date: formData.get("start_date") as string || null,
      end_date: formData.get("end_date") as string || null,
      status: formData.get("status") as "staging" | "published" | "expired",
    };

    // Validate
    const validated = updatePromotionSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Get current promotion for comparison
    const { data: currentPromotion } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentPromotion) {
      return errorResponse("Promotion not found");
    }

    // Set published_at if publishing for first time
    let publishedAt = currentPromotion.published_at;
    if (data.status === "published" && currentPromotion.status !== "published" && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    // Update promotion
    const { data: promotion, error } = await supabase
      .from("promotions")
      .update({
        title: data.title,
        tenant_id: data.tenant_id,
        full_description: data.full_description || null,
        image_url: data.image_url || null,
        source_post: data.source_post || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        status: data.status,
        published_at: publishedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "promotions", {
      resourceType: "promotion",
      resourceId: promotion.id,
      resourceName: promotion.title,
      oldValues: { title: currentPromotion.title, status: currentPromotion.status },
      newValues: { title: promotion.title, status: promotion.status },
    });

    // Revalidate pages
    revalidatePath("/promotions");
    revalidatePath(`/promotions/${id}`);
    revalidatePath("/");

    return successResponse(promotion, "Promotion updated successfully");
  } catch (error) {
    console.error("Update promotion error:", error);
    return errorResponse("Failed to update promotion");
  }
}

// ============================================================================
// DELETE PROMOTION
// ============================================================================

export async function deletePromotion(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get promotion before deletion for logging
    const { data: promotion } = await supabase
      .from("promotions")
      .select("id, title")
      .eq("id", id)
      .single();

    if (!promotion) {
      return errorResponse("Promotion not found");
    }

    // Delete promotion
    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "promotions", {
      resourceType: "promotion",
      resourceId: id,
      resourceName: promotion.title,
    });

    // Revalidate pages
    revalidatePath("/promotions");
    revalidatePath("/");

    return successResponse(undefined, "Promotion deleted successfully");
  } catch (error) {
    console.error("Delete promotion error:", error);
    return errorResponse("Failed to delete promotion");
  }
}

// ============================================================================
// UPDATE PROMOTION STATUS
// ============================================================================

export async function updatePromotionStatus(
  id: string,
  status: "staging" | "published" | "expired"
): Promise<ActionResult<Promotion>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get current promotion
    const { data: currentPromotion } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentPromotion) {
      return errorResponse("Promotion not found");
    }

    // Set published_at if publishing for first time
    let publishedAt = currentPromotion.published_at;
    if (status === "published" && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    const { data: promotion, error } = await supabase
      .from("promotions")
      .update({
        status,
        published_at: publishedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update_status", "promotions", {
      resourceType: "promotion",
      resourceId: promotion.id,
      resourceName: promotion.title,
      oldValues: { status: currentPromotion.status },
      newValues: { status: promotion.status },
    });

    // Revalidate pages
    revalidatePath("/promotions");
    revalidatePath(`/promotions/${id}`);
    revalidatePath("/");

    const statusMessages = {
      staging: "Promotion moved to staging",
      published: "Promotion published",
      expired: "Promotion marked as expired",
    };

    return successResponse(promotion, statusMessages[status]);
  } catch (error) {
    console.error("Update promotion status error:", error);
    return errorResponse("Failed to update promotion status");
  }
}

// ============================================================================
// GET TENANTS (for dropdown)
// ============================================================================

export async function getTenants(): Promise<ActionResult<Tenant[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get tenants error:", error);
    return errorResponse("Failed to fetch tenants");
  }
}

// ============================================================================
// CHECK EXPIRING PROMOTIONS
// ============================================================================

export async function checkExpiringPromotions(): Promise<ActionResult<Promotion[]>> {
  try {
    const supabase = await createClient();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("status", "published")
      .lte("end_date", threeDaysFromNow.toISOString())
      .gte("end_date", new Date().toISOString());

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Check expiring promotions error:", error);
    return errorResponse("Failed to check expiring promotions");
  }
}

// ============================================================================
// AUTO-EXPIRE PROMOTIONS
// ============================================================================

export async function autoExpirePromotions(): Promise<ActionResult<number>> {
  try {
    const supabase = await createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotions")
      .update({ status: "expired" })
      .eq("status", "published")
      .lt("end_date", now)
      .select();

    if (error) {
      return handleSupabaseError(error);
    }

    const count = data?.length || 0;
    if (count > 0) {
      revalidatePath("/promotions");
    }

    return successResponse(count, `${count} promotion(s) expired`);
  } catch (error) {
    console.error("Auto-expire promotions error:", error);
    return errorResponse("Failed to auto-expire promotions");
  }
}
