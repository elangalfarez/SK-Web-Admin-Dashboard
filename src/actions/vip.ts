// src/actions/vip.ts
// Created: Server actions for VIP tiers and benefits management

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { vipTierSchema, vipBenefitSchema, updateTierBenefitsSchema } from "@/lib/validations/vip";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { VipTier, VipBenefit, VipTierWithBenefits } from "@/types/database";

// ============================================================================
// GET VIP TIERS
// ============================================================================

export async function getVipTiers(): Promise<ActionResult<VipTier[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vip_tiers")
      .select("*")
      .order("tier_level", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get VIP tiers error:", error);
    return errorResponse("Failed to fetch VIP tiers");
  }
}

// ============================================================================
// GET VIP TIER WITH BENEFITS
// ============================================================================

export async function getVipTier(id: string): Promise<ActionResult<VipTierWithBenefits>> {
  try {
    const supabase = await createClient();

    // Get tier
    const { data: tier, error: tierError } = await supabase
      .from("vip_tiers")
      .select("*")
      .eq("id", id)
      .single();

    if (tierError) {
      return handleSupabaseError(tierError);
    }

    // Get tier benefits with benefit details
    const { data: tierBenefits, error: benefitsError } = await supabase
      .from("vip_tier_benefits")
      .select(`
        benefit_note,
        display_order,
        benefit:vip_benefits (*)
      `)
      .eq("tier_id", id)
      .order("display_order", { ascending: true });

    if (benefitsError) {
      console.error("Error fetching tier benefits:", benefitsError);
    }

    // Transform the response
    const benefits = (tierBenefits || [])
      .filter((tb: any) => tb.benefit)
      .map((tb: any) => ({
        ...tb.benefit,
        benefit_note: tb.benefit_note,
        display_order: tb.display_order,
      }));

    return successResponse({
      ...tier,
      benefits,
    } as VipTierWithBenefits);
  } catch (error) {
    console.error("Get VIP tier error:", error);
    return errorResponse("Failed to fetch VIP tier");
  }
}

// ============================================================================
// GET ALL VIP TIERS WITH BENEFITS
// ============================================================================

export async function getVipTiersWithBenefits(): Promise<ActionResult<VipTierWithBenefits[]>> {
  try {
    const supabase = await createClient();

    // Get all tiers
    const { data: tiers, error: tiersError } = await supabase
      .from("vip_tiers")
      .select("*")
      .order("tier_level", { ascending: true });

    if (tiersError) {
      return handleSupabaseError(tiersError);
    }

    // Get all tier benefits
    const { data: allTierBenefits, error: benefitsError } = await supabase
      .from("vip_tier_benefits")
      .select(`
        tier_id,
        benefit_note,
        display_order,
        benefit:vip_benefits (*)
      `)
      .order("display_order", { ascending: true });

    if (benefitsError) {
      console.error("Error fetching tier benefits:", benefitsError);
    }

    // Map benefits to tiers
    const tiersWithBenefits = (tiers || []).map((tier) => {
      const tierBenefits = (allTierBenefits || [])
        .filter((tb: any) => tb.tier_id === tier.id && tb.benefit)
        .map((tb: any) => ({
          ...tb.benefit,
          benefit_note: tb.benefit_note,
          display_order: tb.display_order,
        }));

      return {
        ...tier,
        benefits: tierBenefits,
      };
    });

    return successResponse(tiersWithBenefits as VipTierWithBenefits[]);
  } catch (error) {
    console.error("Get VIP tiers with benefits error:", error);
    return errorResponse("Failed to fetch VIP tiers");
  }
}

// ============================================================================
// CREATE VIP TIER
// ============================================================================

export async function createVipTier(
  formData: FormData
): Promise<ActionResult<VipTier>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      qualification_requirement: formData.get("qualification_requirement") as string,
      minimum_spend_amount: Number(formData.get("minimum_spend_amount")) || 0,
      minimum_receipt_amount: formData.get("minimum_receipt_amount") 
        ? Number(formData.get("minimum_receipt_amount")) 
        : null,
      tier_level: Number(formData.get("tier_level")) || 1,
      card_color: formData.get("card_color") as string || "#6b7280",
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = vipTierSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate tier level
    const { data: existing } = await supabase
      .from("vip_tiers")
      .select("id")
      .eq("tier_level", data.tier_level)
      .single();

    if (existing) {
      return errorResponse("A tier with this level already exists");
    }

    // Insert tier
    const { data: tier, error } = await supabase
      .from("vip_tiers")
      .insert({
        name: data.name,
        description: data.description,
        qualification_requirement: data.qualification_requirement,
        minimum_spend_amount: data.minimum_spend_amount,
        minimum_receipt_amount: data.minimum_receipt_amount,
        tier_level: data.tier_level,
        card_color: data.card_color,
        is_active: data.is_active,
        sort_order: data.sort_order,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "vip", {
      resourceType: "tier",
      resourceId: tier.id,
      resourceName: tier.name,
    });

    revalidatePath("/vip");

    return successResponse(tier, "VIP tier created successfully");
  } catch (error) {
    console.error("Create VIP tier error:", error);
    return errorResponse("Failed to create VIP tier");
  }
}

// ============================================================================
// UPDATE VIP TIER
// ============================================================================

export async function updateVipTier(
  id: string,
  formData: FormData
): Promise<ActionResult<VipTier>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      qualification_requirement: formData.get("qualification_requirement") as string,
      minimum_spend_amount: Number(formData.get("minimum_spend_amount")) || 0,
      minimum_receipt_amount: formData.get("minimum_receipt_amount") 
        ? Number(formData.get("minimum_receipt_amount")) 
        : null,
      tier_level: Number(formData.get("tier_level")) || 1,
      card_color: formData.get("card_color") as string || "#6b7280",
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = vipTierSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate tier level (exclude current)
    const { data: existing } = await supabase
      .from("vip_tiers")
      .select("id")
      .eq("tier_level", data.tier_level)
      .neq("id", id)
      .single();

    if (existing) {
      return errorResponse("A tier with this level already exists");
    }

    // Update tier
    const { data: tier, error } = await supabase
      .from("vip_tiers")
      .update({
        name: data.name,
        description: data.description,
        qualification_requirement: data.qualification_requirement,
        minimum_spend_amount: data.minimum_spend_amount,
        minimum_receipt_amount: data.minimum_receipt_amount,
        tier_level: data.tier_level,
        card_color: data.card_color,
        is_active: data.is_active,
        sort_order: data.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "vip", {
      resourceType: "tier",
      resourceId: tier.id,
      resourceName: tier.name,
    });

    revalidatePath("/vip");
    revalidatePath(`/vip/tiers/${id}`);

    return successResponse(tier, "VIP tier updated successfully");
  } catch (error) {
    console.error("Update VIP tier error:", error);
    return errorResponse("Failed to update VIP tier");
  }
}

// ============================================================================
// DELETE VIP TIER
// ============================================================================

export async function deleteVipTier(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get tier for logging
    const { data: tier } = await supabase
      .from("vip_tiers")
      .select("name")
      .eq("id", id)
      .single();

    // Delete tier (cascade will handle tier_benefits)
    const { error } = await supabase
      .from("vip_tiers")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "vip", {
      resourceType: "tier",
      resourceId: id,
      resourceName: tier?.name || "Unknown",
    });

    revalidatePath("/vip");

    return successResponse(undefined, "VIP tier deleted successfully");
  } catch (error) {
    console.error("Delete VIP tier error:", error);
    return errorResponse("Failed to delete VIP tier");
  }
}

// ============================================================================
// GET VIP BENEFITS
// ============================================================================

export async function getVipBenefits(): Promise<ActionResult<VipBenefit[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vip_benefits")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get VIP benefits error:", error);
    return errorResponse("Failed to fetch VIP benefits");
  }
}

// ============================================================================
// CREATE VIP BENEFIT
// ============================================================================

export async function createVipBenefit(
  formData: FormData
): Promise<ActionResult<VipBenefit>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || "",
      icon: formData.get("icon") as string || "gift",
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = vipBenefitSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Insert benefit
    const { data: benefit, error } = await supabase
      .from("vip_benefits")
      .insert({
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        is_active: data.is_active,
        sort_order: data.sort_order,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "vip", {
      resourceType: "benefit",
      resourceId: benefit.id,
      resourceName: benefit.name,
    });

    revalidatePath("/vip");
    revalidatePath("/vip/benefits");

    return successResponse(benefit, "VIP benefit created successfully");
  } catch (error) {
    console.error("Create VIP benefit error:", error);
    return errorResponse("Failed to create VIP benefit");
  }
}

// ============================================================================
// UPDATE VIP BENEFIT
// ============================================================================

export async function updateVipBenefit(
  id: string,
  formData: FormData
): Promise<ActionResult<VipBenefit>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || "",
      icon: formData.get("icon") as string || "gift",
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    // Validate
    const validated = vipBenefitSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Update benefit
    const { data: benefit, error } = await supabase
      .from("vip_benefits")
      .update({
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        is_active: data.is_active,
        sort_order: data.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "vip", {
      resourceType: "benefit",
      resourceId: benefit.id,
      resourceName: benefit.name,
    });

    revalidatePath("/vip");
    revalidatePath("/vip/benefits");

    return successResponse(benefit, "VIP benefit updated successfully");
  } catch (error) {
    console.error("Update VIP benefit error:", error);
    return errorResponse("Failed to update VIP benefit");
  }
}

// ============================================================================
// DELETE VIP BENEFIT
// ============================================================================

export async function deleteVipBenefit(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Check if benefit is used by any tiers
    const { count } = await supabase
      .from("vip_tier_benefits")
      .select("id", { count: "exact", head: true })
      .eq("benefit_id", id);

    if (count && count > 0) {
      return errorResponse(`Cannot delete benefit assigned to ${count} tier(s). Remove from tiers first.`);
    }

    // Get benefit for logging
    const { data: benefit } = await supabase
      .from("vip_benefits")
      .select("name")
      .eq("id", id)
      .single();

    // Delete benefit
    const { error } = await supabase
      .from("vip_benefits")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "vip", {
      resourceType: "benefit",
      resourceId: id,
      resourceName: benefit?.name || "Unknown",
    });

    revalidatePath("/vip");
    revalidatePath("/vip/benefits");

    return successResponse(undefined, "VIP benefit deleted successfully");
  } catch (error) {
    console.error("Delete VIP benefit error:", error);
    return errorResponse("Failed to delete VIP benefit");
  }
}

// ============================================================================
// UPDATE TIER BENEFITS (assign/reassign benefits to a tier)
// ============================================================================

export async function updateTierBenefits(
  tierId: string,
  benefits: { benefit_id: string; benefit_note: string | null; display_order: number }[]
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Validate
    const validated = updateTierBenefitsSchema.safeParse({
      tier_id: tierId,
      benefits,
    });

    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    // Delete existing tier benefits
    const { error: deleteError } = await supabase
      .from("vip_tier_benefits")
      .delete()
      .eq("tier_id", tierId);

    if (deleteError) {
      return handleSupabaseError(deleteError);
    }

    // Insert new tier benefits
    if (benefits.length > 0) {
      const tierBenefits = benefits.map((b, index) => ({
        tier_id: tierId,
        benefit_id: b.benefit_id,
        benefit_note: b.benefit_note || null,
        display_order: b.display_order ?? index,
      }));

      const { error: insertError } = await supabase
        .from("vip_tier_benefits")
        .insert(tierBenefits);

      if (insertError) {
        return handleSupabaseError(insertError);
      }
    }

    // Log activity
    await logActivity(session.userId, "update", "vip", {
      resourceType: "tier_benefits",
      resourceId: tierId,
      newValues: { benefit_count: benefits.length },
    });

    revalidatePath("/vip");
    revalidatePath(`/vip/tiers/${tierId}`);

    return successResponse(undefined, "Tier benefits updated successfully");
  } catch (error) {
    console.error("Update tier benefits error:", error);
    return errorResponse("Failed to update tier benefits");
  }
}

// ============================================================================
// TOGGLE TIER STATUS
// ============================================================================

export async function toggleVipTierStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<VipTier>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data: tier, error } = await supabase
      .from("vip_tiers")
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
    await logActivity(session.userId, isActive ? "activate" : "deactivate", "vip", {
      resourceType: "tier",
      resourceId: tier.id,
      resourceName: tier.name,
    });

    revalidatePath("/vip");

    return successResponse(tier, isActive ? "Tier activated" : "Tier deactivated");
  } catch (error) {
    console.error("Toggle VIP tier status error:", error);
    return errorResponse("Failed to update tier status");
  }
}
