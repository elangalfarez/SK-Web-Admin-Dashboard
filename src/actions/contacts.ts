// src/actions/contacts.ts
// Created: Server actions for contacts management

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { Contact, EnquiryType, PaginatedResult } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface ContactWithResponse extends Contact {
  admin_response?: {
    id: string;
    response_message: string;
    responded_at: string;
    responded_by: string;
    admin_name?: string;
  } | null;
}

export interface ContactStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  todayCount: number;
  weekCount: number;
}

// ============================================================================
// GET CONTACTS (with pagination and filters)
// ============================================================================

export async function getContacts(
  filters: {
    page?: number;
    perPage?: number;
    search?: string;
    enquiryType?: EnquiryType | "all";
    status?: "all" | "read" | "unread";
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<ActionResult<PaginatedResult<Contact>>> {
  try {
    const supabase = await createClient();
    const {
      page = 1,
      perPage = 10,
      search,
      enquiryType,
      status,
      startDate,
      endDate,
      sortBy = "submitted_date",
      sortOrder = "desc",
    } = filters;

    // Build query
    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,enquiry_details.ilike.%${search}%`
      );
    }

    if (enquiryType && enquiryType !== "all") {
      query = query.eq("enquiry_type", enquiryType);
    }

    if (status && status !== "all") {
      query = query.eq("is_read", status === "read");
    }

    if (startDate) {
      query = query.gte("submitted_date", startDate);
    }

    if (endDate) {
      query = query.lte("submitted_date", endDate);
    }

    // Apply sorting
    const orderColumn = sortBy || "submitted_date";
    const orderAscending = sortOrder === "asc";
    query = query.order(orderColumn, { ascending: orderAscending });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({
      data: (data || []) as Contact[],
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    return errorResponse("Failed to fetch contacts");
  }
}

// ============================================================================
// GET SINGLE CONTACT
// ============================================================================

export async function getContact(id: string): Promise<ActionResult<ContactWithResponse>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Check for admin response (if table exists)
    let adminResponse = null;
    try {
      const { data: response } = await supabase
        .from("contact_responses")
        .select(`
          id,
          response_message,
          responded_at,
          responded_by,
          admin:admin_users!responded_by (full_name)
        `)
        .eq("contact_id", id)
        .order("responded_at", { ascending: false })
        .limit(1)
        .single();

      if (response) {
        adminResponse = {
          id: response.id,
          response_message: response.response_message,
          responded_at: response.responded_at,
          responded_by: response.responded_by,
          admin_name: (response.admin as any)?.full_name,
        };
      }
    } catch {
      // Table might not exist, that's fine
    }

    return successResponse({
      ...data,
      admin_response: adminResponse,
    } as ContactWithResponse);
  } catch (error) {
    console.error("Get contact error:", error);
    return errorResponse("Failed to fetch contact");
  }
}

// ============================================================================
// MARK CONTACT AS READ
// ============================================================================

export async function markContactAsRead(id: string): Promise<ActionResult<Contact>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("contacts")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "read", "contacts", {
      resourceType: "contact",
      resourceId: id,
      resourceName: data.full_name,
    });

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);

    return successResponse(data, "Marked as read");
  } catch (error) {
    console.error("Mark contact as read error:", error);
    return errorResponse("Failed to update contact");
  }
}

// ============================================================================
// MARK CONTACT AS UNREAD
// ============================================================================

export async function markContactAsUnread(id: string): Promise<ActionResult<Contact>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("contacts")
      .update({ is_read: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);

    return successResponse(data, "Marked as unread");
  } catch (error) {
    console.error("Mark contact as unread error:", error);
    return errorResponse("Failed to update contact");
  }
}

// ============================================================================
// MARK MULTIPLE CONTACTS AS READ
// ============================================================================

export async function markMultipleAsRead(ids: string[]): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    if (ids.length === 0) {
      return errorResponse("No contacts selected");
    }

    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("contacts")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "bulk_read", "contacts", {
      resourceType: "contact",
      metadata: { count: ids.length },
    });

    revalidatePath("/contacts");

    return successResponse(undefined, `${ids.length} contact(s) marked as read`);
  } catch (error) {
    console.error("Mark multiple as read error:", error);
    return errorResponse("Failed to update contacts");
  }
}

// ============================================================================
// DELETE CONTACT
// ============================================================================

export async function deleteContact(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get contact for logging
    const { data: contact } = await supabase
      .from("contacts")
      .select("full_name, email")
      .eq("id", id)
      .single();

    if (!contact) {
      return errorResponse("Contact not found");
    }

    // Delete contact
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "contacts", {
      resourceType: "contact",
      resourceId: id,
      resourceName: contact.full_name,
    });

    revalidatePath("/contacts");

    return successResponse(undefined, "Contact deleted successfully");
  } catch (error) {
    console.error("Delete contact error:", error);
    return errorResponse("Failed to delete contact");
  }
}

// ============================================================================
// DELETE MULTIPLE CONTACTS
// ============================================================================

export async function deleteMultipleContacts(ids: string[]): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    if (ids.length === 0) {
      return errorResponse("No contacts selected");
    }

    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("contacts")
      .delete()
      .in("id", ids);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "bulk_delete", "contacts", {
      resourceType: "contact",
      metadata: { count: ids.length },
    });

    revalidatePath("/contacts");

    return successResponse(undefined, `${ids.length} contact(s) deleted`);
  } catch (error) {
    console.error("Delete multiple contacts error:", error);
    return errorResponse("Failed to delete contacts");
  }
}

// ============================================================================
// GET CONTACT STATS
// ============================================================================

export async function getContactStats(): Promise<ActionResult<ContactStats>> {
  try {
    const supabase = await createClient();

    // Get total count
    const { count: total } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true });

    // Get unread count
    const { count: unread } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    // Get counts by type
    const { data: typeData } = await supabase
      .from("contacts")
      .select("enquiry_type");

    const byType: Record<string, number> = {};
    (typeData || []).forEach((item) => {
      const type = item.enquiry_type;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .gte("submitted_date", today.toISOString());

    // Get this week's count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekCount } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .gte("submitted_date", weekAgo.toISOString());

    return successResponse({
      total: total || 0,
      unread: unread || 0,
      byType,
      todayCount: todayCount || 0,
      weekCount: weekCount || 0,
    });
  } catch (error) {
    console.error("Get contact stats error:", error);
    return errorResponse("Failed to fetch contact stats");
  }
}

// ============================================================================
// EXPORT CONTACTS
// ============================================================================

export async function exportContacts(
  filters: {
    enquiryType?: EnquiryType | "all";
    status?: "all" | "read" | "unread";
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<ActionResult<Contact[]>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createClient();
    const { enquiryType, status, startDate, endDate } = filters;

    let query = supabase
      .from("contacts")
      .select("*")
      .order("submitted_date", { ascending: false });

    if (enquiryType && enquiryType !== "all") {
      query = query.eq("enquiry_type", enquiryType);
    }

    if (status && status !== "all") {
      query = query.eq("is_read", status === "read");
    }

    if (startDate) {
      query = query.gte("submitted_date", startDate);
    }

    if (endDate) {
      query = query.lte("submitted_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "export", "contacts", {
      resourceType: "contact",
      metadata: {
        count: (data || []).length,
        filters,
      },
    });

    return successResponse(data || [], `Exported ${(data || []).length} contacts`);
  } catch (error) {
    console.error("Export contacts error:", error);
    return errorResponse("Failed to export contacts");
  }
}
