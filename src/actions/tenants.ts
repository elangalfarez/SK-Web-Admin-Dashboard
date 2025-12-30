// src/actions/tenants.ts
// Created: Server actions for tenants and categories CRUD operations

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { createTenantSchema, updateTenantSchema, tenantCategorySchema, type TenantFilters } from "@/lib/validations/tenant";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { Tenant, TenantCategory, MallFloor, PaginatedResult } from "@/types/database";

// ============================================================================
// TENANT WITH CATEGORY TYPE
// ============================================================================

export interface TenantWithCategory extends Tenant {
  category: TenantCategory | null;
}

// ============================================================================
// GET TENANTS (with pagination and filters)
// ============================================================================

export async function getTenantsList(
  filters: TenantFilters = { page: 1, perPage: 10 }
): Promise<ActionResult<PaginatedResult<TenantWithCategory>>> {
  try {
    const supabase = await createClient();
    const { page, perPage, search, categoryId, floor, status, featured, newTenant, sortBy, sortOrder } = filters;

    // Build query - fetch tenants without join (no FK relationship may exist)
    let query = supabase
      .from("tenants")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,tenant_code.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (floor) {
      query = query.eq("main_floor", floor);
    }

    if (status && status !== "all") {
      query = query.eq("is_active", status === "active");
    }

    if (featured !== undefined) {
      query = query.eq("is_featured", featured);
    }

    if (newTenant !== undefined) {
      query = query.eq("is_new_tenant", newTenant);
    }

    // Apply sorting
    const orderColumn = sortBy || "name";
    const orderDirection = sortOrder === "desc" ? false : true;
    query = query.order(orderColumn, { ascending: orderDirection });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: tenants, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch categories separately
    const categoryIds = [...new Set((tenants || []).map(t => t.category_id).filter(Boolean))];
    let categoriesMap: Record<string, TenantCategory> = {};

    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from("tenant_categories")
        .select("id, name, display_name, icon, color")
        .in("id", categoryIds);

      if (categories) {
        categoriesMap = categories.reduce((acc, cat) => {
          acc[cat.id] = cat as TenantCategory;
          return acc;
        }, {} as Record<string, TenantCategory>);
      }
    }

    // Merge tenants with category data
    const tenantsWithCategory: TenantWithCategory[] = (tenants || []).map(tenant => ({
      ...tenant,
      category: tenant.category_id ? categoriesMap[tenant.category_id] || null : null,
    }));

    return successResponse({
      data: tenantsWithCategory,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    return errorResponse("Failed to fetch tenants");
  }
}

// ============================================================================
// GET SINGLE TENANT
// ============================================================================

export async function getTenant(id: string): Promise<ActionResult<TenantWithCategory>> {
  try {
    const supabase = await createClient();

    // Fetch tenant without join (no FK relationship may exist)
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch category separately
    let category: TenantCategory | null = null;
    if (tenant.category_id) {
      const { data: categoryData } = await supabase
        .from("tenant_categories")
        .select("id, name, display_name, icon, color")
        .eq("id", tenant.category_id)
        .single();

      category = categoryData as TenantCategory | null;
    }

    return successResponse({
      ...tenant,
      category,
    } as TenantWithCategory);
  } catch (error) {
    console.error("Get tenant error:", error);
    return errorResponse("Failed to fetch tenant");
  }
}

// ============================================================================
// GET TENANT BY CODE
// ============================================================================

export async function getTenantByCode(code: string): Promise<ActionResult<TenantWithCategory>> {
  try {
    const supabase = await createClient();

    // Fetch tenant without join (no FK relationship may exist)
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_code", code)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch category separately
    let category: TenantCategory | null = null;
    if (tenant.category_id) {
      const { data: categoryData } = await supabase
        .from("tenant_categories")
        .select("id, name, display_name, icon, color")
        .eq("id", tenant.category_id)
        .single();

      category = categoryData as TenantCategory | null;
    }

    return successResponse({
      ...tenant,
      category,
    } as TenantWithCategory);
  } catch (error) {
    console.error("Get tenant by code error:", error);
    return errorResponse("Failed to fetch tenant");
  }
}

// ============================================================================
// CREATE TENANT
// ============================================================================

export async function createTenant(
  formData: FormData
): Promise<ActionResult<Tenant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      tenant_code: (formData.get("tenant_code") as string).toUpperCase(),
      name: formData.get("name") as string,
      category_id: formData.get("category_id") as string,
      description: formData.get("description") as string || "",
      main_floor: formData.get("main_floor") as string,
      operating_hours: JSON.parse(formData.get("operating_hours") as string || "{}"),
      phone: formData.get("phone") as string || "",
      logo_url: formData.get("logo_url") as string || null,
      banner_url: formData.get("banner_url") as string || null,
      is_active: formData.get("is_active") === "true",
      is_featured: formData.get("is_featured") === "true",
      is_new_tenant: formData.get("is_new_tenant") === "true",
    };

    // Validate
    const validated = createTenantSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate tenant code
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("tenant_code", data.tenant_code)
      .single();

    if (existing) {
      return errorResponse("A tenant with this code already exists");
    }

    // Insert tenant
    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        tenant_code: data.tenant_code,
        name: data.name,
        category_id: data.category_id,
        description: data.description || null,
        main_floor: data.main_floor,
        operating_hours: data.operating_hours || null,
        phone: data.phone || null,
        logo_url: data.logo_url || null,
        banner_url: data.banner_url || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        is_new_tenant: data.is_new_tenant,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "tenants", {
      resourceType: "tenant",
      resourceId: tenant.id,
      resourceName: tenant.name,
      newValues: { tenant_code: tenant.tenant_code, name: tenant.name },
    });

    // Revalidate pages
    revalidatePath("/tenants");
    revalidatePath("/");

    return successResponse(tenant, "Tenant created successfully");
  } catch (error) {
    console.error("Create tenant error:", error);
    return errorResponse("Failed to create tenant");
  }
}

// ============================================================================
// UPDATE TENANT
// ============================================================================

export async function updateTenant(
  id: string,
  formData: FormData
): Promise<ActionResult<Tenant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      id,
      tenant_code: (formData.get("tenant_code") as string).toUpperCase(),
      name: formData.get("name") as string,
      category_id: formData.get("category_id") as string,
      description: formData.get("description") as string || "",
      main_floor: formData.get("main_floor") as string,
      operating_hours: JSON.parse(formData.get("operating_hours") as string || "{}"),
      phone: formData.get("phone") as string || "",
      logo_url: formData.get("logo_url") as string || null,
      banner_url: formData.get("banner_url") as string || null,
      is_active: formData.get("is_active") === "true",
      is_featured: formData.get("is_featured") === "true",
      is_new_tenant: formData.get("is_new_tenant") === "true",
    };

    // Validate
    const validated = updateTenantSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Get current tenant for comparison
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentTenant) {
      return errorResponse("Tenant not found");
    }

    // Check for duplicate tenant code (if changed)
    if (data.tenant_code && data.tenant_code !== currentTenant.tenant_code) {
      const { data: existing } = await supabase
        .from("tenants")
        .select("id")
        .eq("tenant_code", data.tenant_code)
        .neq("id", id)
        .single();

      if (existing) {
        return errorResponse("A tenant with this code already exists");
      }
    }

    // Update tenant
    const { data: tenant, error } = await supabase
      .from("tenants")
      .update({
        tenant_code: data.tenant_code,
        name: data.name,
        category_id: data.category_id,
        description: data.description || null,
        main_floor: data.main_floor,
        operating_hours: data.operating_hours || null,
        phone: data.phone || null,
        logo_url: data.logo_url || null,
        banner_url: data.banner_url || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        is_new_tenant: data.is_new_tenant,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "tenants", {
      resourceType: "tenant",
      resourceId: tenant.id,
      resourceName: tenant.name,
      oldValues: { name: currentTenant.name, is_active: currentTenant.is_active },
      newValues: { name: tenant.name, is_active: tenant.is_active },
    });

    // Revalidate pages
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);
    revalidatePath("/");

    return successResponse(tenant, "Tenant updated successfully");
  } catch (error) {
    console.error("Update tenant error:", error);
    return errorResponse("Failed to update tenant");
  }
}

// ============================================================================
// DELETE TENANT
// ============================================================================

export async function deleteTenant(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Check for linked promotions
    const { count: promoCount } = await supabase
      .from("promotions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id);

    if (promoCount && promoCount > 0) {
      return errorResponse(`Cannot delete tenant with ${promoCount} promotion(s). Delete promotions first.`);
    }

    // Get tenant for logging
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, tenant_code")
      .eq("id", id)
      .single();

    if (!tenant) {
      return errorResponse("Tenant not found");
    }

    // Delete tenant
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "tenants", {
      resourceType: "tenant",
      resourceId: id,
      resourceName: tenant.name,
    });

    // Revalidate pages
    revalidatePath("/tenants");
    revalidatePath("/");

    return successResponse(undefined, "Tenant deleted successfully");
  } catch (error) {
    console.error("Delete tenant error:", error);
    return errorResponse("Failed to delete tenant");
  }
}

// ============================================================================
// TOGGLE TENANT STATUS
// ============================================================================

export async function toggleTenantStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Tenant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: tenant, error } = await supabase
      .from("tenants")
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

    // Log activity
    await logActivity(session.userId, isActive ? "activate" : "deactivate", "tenants", {
      resourceType: "tenant",
      resourceId: tenant.id,
      resourceName: tenant.name,
    });

    // Revalidate pages
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);

    return successResponse(tenant, isActive ? "Tenant activated" : "Tenant deactivated");
  } catch (error) {
    console.error("Toggle tenant status error:", error);
    return errorResponse("Failed to update tenant status");
  }
}

// ============================================================================
// TOGGLE TENANT FEATURED
// ============================================================================

export async function toggleTenantFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<Tenant>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: tenant, error } = await supabase
      .from("tenants")
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "feature", "tenants", {
      resourceType: "tenant",
      resourceId: tenant.id,
      resourceName: tenant.name,
      newValues: { is_featured: isFeatured },
    });

    // Revalidate pages
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);

    return successResponse(tenant, isFeatured ? "Tenant featured" : "Tenant unfeatured");
  } catch (error) {
    console.error("Toggle tenant featured error:", error);
    return errorResponse("Failed to update tenant");
  }
}

// ============================================================================
// TENANT CATEGORIES
// ============================================================================

export async function getTenantCategories(): Promise<ActionResult<TenantCategory[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenant_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get tenant categories error:", error);
    return errorResponse("Failed to fetch categories");
  }
}

export async function getTenantCategory(id: string): Promise<ActionResult<TenantCategory>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenant_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data);
  } catch (error) {
    console.error("Get tenant category error:", error);
    return errorResponse("Failed to fetch category");
  }
}

export async function createTenantCategory(
  formData: FormData
): Promise<ActionResult<TenantCategory>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const rawData = {
      name: formData.get("name") as string,
      display_name: formData.get("display_name") as string,
      icon: formData.get("icon") as string || "",
      color: formData.get("color") as string || "",
      description: formData.get("description") as string || "",
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
    };

    // Validate
    const validated = tenantCategorySchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("tenant_categories")
      .select("id")
      .eq("name", data.name)
      .single();

    if (existing) {
      return errorResponse("A category with this name already exists");
    }

    // Insert category
    const { data: category, error } = await supabase
      .from("tenant_categories")
      .insert({
        name: data.name,
        display_name: data.display_name,
        icon: data.icon || "store",
        color: data.color || "#6b7280",
        description: data.description || null,
        sort_order: data.sort_order,
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "tenants", {
      resourceType: "category",
      resourceId: category.id,
      resourceName: category.display_name,
    });

    revalidatePath("/tenants/categories");

    return successResponse(category, "Category created successfully");
  } catch (error) {
    console.error("Create tenant category error:", error);
    return errorResponse("Failed to create category");
  }
}

export async function updateTenantCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<TenantCategory>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const rawData = {
      name: formData.get("name") as string,
      display_name: formData.get("display_name") as string,
      icon: formData.get("icon") as string || "",
      color: formData.get("color") as string || "",
      description: formData.get("description") as string || "",
      sort_order: Number(formData.get("sort_order")) || 0,
      is_active: formData.get("is_active") === "true",
    };

    // Validate
    const validated = tenantCategorySchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate name (if changed)
    const { data: existing } = await supabase
      .from("tenant_categories")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!existing) {
      return errorResponse("Category not found");
    }

    if (data.name !== existing.name) {
      const { data: duplicate } = await supabase
        .from("tenant_categories")
        .select("id")
        .eq("name", data.name)
        .neq("id", id)
        .single();

      if (duplicate) {
        return errorResponse("A category with this name already exists");
      }
    }

    // Update category
    const { data: category, error } = await supabase
      .from("tenant_categories")
      .update({
        name: data.name,
        display_name: data.display_name,
        icon: data.icon || "store",
        color: data.color || "#6b7280",
        description: data.description || null,
        sort_order: data.sort_order,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "tenants", {
      resourceType: "category",
      resourceId: category.id,
      resourceName: category.display_name,
    });

    revalidatePath("/tenants/categories");

    return successResponse(category, "Category updated successfully");
  } catch (error) {
    console.error("Update tenant category error:", error);
    return errorResponse("Failed to update category");
  }
}

export async function deleteTenantCategory(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Check if category has tenants
    const { count } = await supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return errorResponse(`Cannot delete category with ${count} tenant(s). Move tenants first.`);
    }

    // Get category for logging
    const { data: category } = await supabase
      .from("tenant_categories")
      .select("display_name")
      .eq("id", id)
      .single();

    // Delete category
    const { error } = await supabase
      .from("tenant_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "tenants", {
      resourceType: "category",
      resourceId: id,
      resourceName: category?.display_name || "Unknown",
    });

    revalidatePath("/tenants/categories");

    return successResponse(undefined, "Category deleted successfully");
  } catch (error) {
    console.error("Delete tenant category error:", error);
    return errorResponse("Failed to delete category");
  }
}

// ============================================================================
// MALL FLOORS
// ============================================================================

export async function getMallFloors(): Promise<ActionResult<MallFloor[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mall_floors")
      .select("*")
      .eq("is_active", true)
      .order("floor_number", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get mall floors error:", error);
    return errorResponse("Failed to fetch floors");
  }
}
