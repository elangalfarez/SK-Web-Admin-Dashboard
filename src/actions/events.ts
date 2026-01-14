// src/actions/events.ts
// Created: Server actions for events CRUD operations

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { generateSlug } from "@/lib/utils/slug";
import { createEventSchema, updateEventSchema, type EventFilters } from "@/lib/validations/event";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { Event, PaginatedResult } from "@/types/database";
import { checkUserPermission } from "@/lib/supabase/permission-check";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize event data to ensure images and tags are arrays
 * Converts legacy string-only images to proper object format
 */
function normalizeEventData(event: Event): Event {
  return {
    ...event,
    images: Array.isArray(event.images)
      ? event.images.map((img) => {
          // If it's already an object with url property, return as-is
          if (typeof img === "object" && img !== null && "url" in img) {
            return img;
          }
          // If it's a string (legacy format), convert to object
          if (typeof img === "string") {
            return {
              url: img,
              alt: event.title || "Event image",
              caption: "Event image",
            };
          }
          // Fallback: return as-is
          return img;
        })
      : [],
    tags: Array.isArray(event.tags) ? event.tags : [],
  };
}

// ============================================================================
// GET EVENTS (with pagination and filters)
// ============================================================================

export async function getEvents(
  filters: EventFilters = { page: 1, perPage: 10 }
): Promise<ActionResult<PaginatedResult<Event>>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "view"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to view events");
    }

    const supabase = await createClient();
    const { page, perPage, search, status, featured, startDate, endDate, tags, sortBy, sortOrder } = filters;

    // Build query
    let query = supabase
      .from("events")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      const now = new Date().toISOString();
      switch (status) {
        case "draft":
          query = query.eq("is_published", false);
          break;
        case "published":
          query = query.eq("is_published", true);
          break;
        case "upcoming":
          query = query.gt("start_at", now);
          break;
        case "ongoing":
          query = query.lte("start_at", now).or(`end_at.is.null,end_at.gte.${now}`);
          break;
        case "ended":
          query = query.lt("end_at", now);
          break;
      }
    }

    if (featured !== undefined) {
      query = query.eq("is_featured", featured);
    }

    if (startDate) {
      query = query.gte("start_at", startDate);
    }

    if (endDate) {
      query = query.lte("start_at", endDate);
    }

    if (tags && tags.length > 0) {
      query = query.contains("tags", tags);
    }

    // Apply sorting
    const orderColumn = sortBy || "created_at";
    const orderDirection = sortOrder === "asc" ? true : false;
    query = query.order(orderColumn, { ascending: orderDirection });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Normalize event data to handle legacy image formats
    const normalizedData = (data || []).map(normalizeEventData);

    return successResponse({
      data: normalizedData,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get events error:", error);
    return errorResponse("Failed to fetch events");
  }
}

// ============================================================================
// GET SINGLE EVENT
// ============================================================================

export async function getEvent(id: string): Promise<ActionResult<Event>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Normalize event data to handle legacy image formats
    const normalizedData = normalizeEventData(data);

    return successResponse(normalizedData);
  } catch (error) {
    console.error("Get event error:", error);
    return errorResponse("Failed to fetch event");
  }
}

// ============================================================================
// GET EVENT BY SLUG
// ============================================================================

export async function getEventBySlug(slug: string): Promise<ActionResult<Event>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Normalize event data to handle legacy image formats
    const normalizedData = normalizeEventData(data);

    return successResponse(normalizedData);
  } catch (error) {
    console.error("Get event by slug error:", error);
    return errorResponse("Failed to fetch event");
  }
}

// ============================================================================
// CREATE EVENT
// ============================================================================

export async function createEvent(
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "create"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to create events");
    }

    // Parse form data
    const rawData = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      summary: formData.get("summary") as string || "",
      body: formData.get("body") as string || "",
      start_at: formData.get("start_at") as string,
      end_at: formData.get("end_at") as string || "",
      venue: formData.get("venue") as string || "",
      images: JSON.parse(formData.get("images") as string || "[]"),
      tags: JSON.parse(formData.get("tags") as string || "[]"),
      is_published: formData.get("is_published") === "true",
      is_featured: formData.get("is_featured") === "true",
    };

    // Validate
    const validated = createEventSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }

    const supabase = await createAdminClient();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", data.slug)
      .single();

    if (existing) {
      // Append timestamp to make unique
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Insert event
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: data.title,
        slug: data.slug,
        summary: data.summary || null,
        body: data.body || null,
        start_at: data.start_at,
        end_at: data.end_at || null,
        venue: data.venue || null,
        images: data.images,
        tags: data.tags,
        is_published: data.is_published,
        is_featured: data.is_featured,
        created_by: session.userId,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "create", "events", {
      resourceType: "event",
      resourceId: event.id,
      resourceName: event.title,
      newValues: { title: event.title, is_published: event.is_published },
    });

    // Revalidate events pages
    revalidatePath("/events");
    revalidatePath("/");

    return successResponse(event, "Event created successfully");
  } catch (error) {
    console.error("Create event error:", error);
    return errorResponse("Failed to create event");
  }
}

// ============================================================================
// UPDATE EVENT
// ============================================================================

export async function updateEvent(
  id: string,
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "edit"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to edit events");
    }

    // Parse form data
    const rawData = {
      id,
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      summary: formData.get("summary") as string || "",
      body: formData.get("body") as string || "",
      start_at: formData.get("start_at") as string,
      end_at: formData.get("end_at") as string || "",
      venue: formData.get("venue") as string || "",
      images: JSON.parse(formData.get("images") as string || "[]"),
      tags: JSON.parse(formData.get("tags") as string || "[]"),
      is_published: formData.get("is_published") === "true",
      is_featured: formData.get("is_featured") === "true",
    };

    // Validate
    const validated = updateEventSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Get current event for comparison
    const { data: currentEvent } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentEvent) {
      return errorResponse("Event not found");
    }

    // Check for duplicate slug (if changed)
    if (data.slug && data.slug !== currentEvent.slug) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", data.slug)
        .neq("id", id)
        .single();

      if (existing) {
        return errorResponse("An event with this slug already exists");
      }
    }

    // Update event
    const { data: event, error } = await supabase
      .from("events")
      .update({
        title: data.title,
        slug: data.slug,
        summary: data.summary || null,
        body: data.body || null,
        start_at: data.start_at,
        end_at: data.end_at || null,
        venue: data.venue || null,
        images: data.images,
        tags: data.tags,
        is_published: data.is_published,
        is_featured: data.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "events", {
      resourceType: "event",
      resourceId: event.id,
      resourceName: event.title,
      oldValues: { title: currentEvent.title, is_published: currentEvent.is_published },
      newValues: { title: event.title, is_published: event.is_published },
    });

    // Revalidate pages
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/");

    return successResponse(event, "Event updated successfully");
  } catch (error) {
    console.error("Update event error:", error);
    return errorResponse("Failed to update event");
  }
}

// ============================================================================
// DELETE EVENT
// ============================================================================

export async function deleteEvent(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "delete"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to delete events");
    }

    const supabase = await createAdminClient();

    // Get event before deletion for logging
    const { data: event } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", id)
      .single();

    if (!event) {
      return errorResponse("Event not found");
    }

    // Delete event
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "events", {
      resourceType: "event",
      resourceId: id,
      resourceName: event.title,
    });

    // Revalidate pages
    revalidatePath("/events");
    revalidatePath("/");

    return successResponse(undefined, "Event deleted successfully");
  } catch (error) {
    console.error("Delete event error:", error);
    return errorResponse("Failed to delete event");
  }
}

// ============================================================================
// TOGGLE EVENT PUBLISH STATUS
// ============================================================================

export async function toggleEventPublish(
  id: string,
  isPublished: boolean
): Promise<ActionResult<Event>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "publish"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to publish events");
    }

    const supabase = await createAdminClient();

    const { data: event, error } = await supabase
      .from("events")
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, isPublished ? "publish" : "unpublish", "events", {
      resourceType: "event",
      resourceId: event.id,
      resourceName: event.title,
    });

    // Revalidate pages
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    revalidatePath("/");

    return successResponse(event, isPublished ? "Event published" : "Event unpublished");
  } catch (error) {
    console.error("Toggle event publish error:", error);
    return errorResponse("Failed to update event");
  }
}

// ============================================================================
// TOGGLE EVENT FEATURED STATUS
// ============================================================================

export async function toggleEventFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<Event>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Check permission
    const hasPermission = await checkUserPermission(
      session.userId,
      "events",
      "edit"
    );
    if (!hasPermission) {
      return errorResponse("Forbidden: You don't have permission to edit events");
    }

    const supabase = await createAdminClient();

    const { data: event, error } = await supabase
      .from("events")
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
    await logActivity(session.userId, "feature", "events", {
      resourceType: "event",
      resourceId: event.id,
      resourceName: event.title,
      newValues: { is_featured: isFeatured },
    });

    // Revalidate pages
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);

    return successResponse(event, isFeatured ? "Event featured" : "Event unfeatured");
  } catch (error) {
    console.error("Toggle event featured error:", error);
    return errorResponse("Failed to update event");
  }
}

// ============================================================================
// GET ALL TAGS (for autocomplete)
// ============================================================================

export async function getEventTags(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("tags");

    if (error) {
      return handleSupabaseError(error);
    }

    // Extract unique tags from all events
    const allTags = data?.flatMap((e) => e.tags || []) || [];
    const uniqueTags = [...new Set(allTags)].sort();

    return successResponse(uniqueTags);
  } catch (error) {
    console.error("Get event tags error:", error);
    return errorResponse("Failed to fetch tags");
  }
}
