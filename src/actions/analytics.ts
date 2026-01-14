// src/actions/analytics.ts
// Created: Server actions for activity logs and dashboard analytics

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type {
  ActivityLogWithUser,
  DashboardStats,
  ContentStatsOverview,
  RecentActivity,
  PaginatedResult,
} from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityFilters {
  search?: string;
  action?: string;
  module?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface AnalyticsSummary {
  stats: DashboardStats;
  contentOverview: ContentStatsOverview[];
  recentActivity: RecentActivity[];
  activityByDay: { date: string; count: number }[];
  activityByModule: { module: string; count: number }[];
}

export interface AdminUserOption {
  id: string;
  full_name: string;
  email: string;
}

// ============================================================================
// GET ACTIVITY LOGS (with pagination and filters)
// ============================================================================

export async function getActivityLogs(
  filters: ActivityFilters = {}
): Promise<ActionResult<PaginatedResult<ActivityLogWithUser>>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();
    const {
      page = 1,
      perPage = 20,
      search,
      action,
      module,
      userId,
      startDate,
      endDate,
    } = filters;

    // Build query
    let query = supabase
      .from("admin_activity_logs")
      .select(
        `
        *,
        user:admin_users!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `,
        { count: "exact" }
      );

    // Apply filters
    if (search) {
      query = query.or(
        `resource_name.ilike.%${search}%,action.ilike.%${search}%,module.ilike.%${search}%`
      );
    }

    if (action && action !== "all") {
      query = query.eq("action", action);
    }

    if (module && module !== "all") {
      query = query.eq("module", module);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // Apply sorting and pagination
    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse({
      data: (data || []) as ActivityLogWithUser[],
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    return errorResponse("Failed to fetch activity logs");
  }
}

// ============================================================================
// GET SINGLE ACTIVITY LOG
// ============================================================================

export async function getActivityLog(
  id: string
): Promise<ActionResult<ActivityLogWithUser>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select(
        `
        *,
        user:admin_users!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data as ActivityLogWithUser);
  } catch (error) {
    console.error("Get activity log error:", error);
    return errorResponse("Failed to fetch activity log");
  }
}

// ============================================================================
// GET DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const supabase = await createClient();

    // Parallel queries for all stats
    const [
      eventsResult,
      tenantsResult,
      postsResult,
      promotionsResult,
      contactsResult,
      vipResult,
    ] = await Promise.all([
      // Events
      supabase.from("events").select("id, is_published, start_at, end_at"),
      // Tenants
      supabase.from("tenants").select("id, is_active, is_featured"),
      // Posts
      supabase.from("posts").select("id, is_published"),
      // Promotions
      supabase.from("promotions").select("id, status"),
      // Contacts
      supabase.from("contacts").select("*"),
      // VIP Tiers
      supabase.from("vip_tiers").select("id, is_active"),
    ]);

    const now = new Date().toISOString();
    const events = eventsResult.data || [];
    const tenants = tenantsResult.data || [];
    const posts = postsResult.data || [];
    const promotions = promotionsResult.data || [];
    const contacts = contactsResult.data || [];
    const vipTiers = vipResult.data || [];

    const stats: DashboardStats = {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.is_published).length,
      upcomingEvents: events.filter(
        (e) => e.is_published && new Date(e.start_at) > new Date(now)
      ).length,
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.is_active).length,
      featuredTenants: tenants.filter((t) => t.is_featured).length,
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.is_published).length,
      totalPromotions: promotions.length,
      activePromotions: promotions.filter((p) => p.status === "published").length,
      totalContacts: contacts.length,
      unreadContacts: contacts.filter((c) => c.is_read !== true).length,
      totalVipTiers: vipTiers.length,
      activeVipTiers: vipTiers.filter((v) => v.is_active).length,
    };

    return successResponse(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return errorResponse("Failed to fetch dashboard stats");
  }
}

// ============================================================================
// GET CONTENT OVERVIEW
// ============================================================================

export async function getContentOverview(): Promise<
  ActionResult<ContentStatsOverview[]>
> {
  try {
    const supabase = await createClient();

    // Get counts for each content type
    const now = new Date().toISOString();

    // Events
    const { data: events } = await supabase
      .from("events")
      .select("id, is_published, is_featured, start_at, end_at");

    // Tenants
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, is_active, is_featured");

    // Posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id, is_published, is_featured");

    // Promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("id, status, start_date, end_date");

    // What's On
    const { data: whatsOn } = await supabase
      .from("whats_on")
      .select("content_type, reference_id, is_active");

    const activeWhatsOn = (whatsOn || []).filter((w) => w.is_active);

    const overview: ContentStatsOverview[] = [
      {
        content_type: "Events",
        total_count: (events || []).length,
        published_count: (events || []).filter((e) => e.is_published).length,
        featured_count: (events || []).filter((e) => e.is_featured).length,
        upcoming_count: (events || []).filter(
          (e) => e.is_published && new Date(e.start_at) > new Date(now)
        ).length,
        ongoing_count: (events || []).filter(
          (e) =>
            e.is_published &&
            new Date(e.start_at) <= new Date(now) &&
            (!e.end_at || new Date(e.end_at) >= new Date(now))
        ).length,
        in_whats_on_count: activeWhatsOn.filter((w) => w.content_type === "event")
          .length,
      },
      {
        content_type: "Tenants",
        total_count: (tenants || []).length,
        published_count: (tenants || []).filter((t) => t.is_active).length,
        featured_count: (tenants || []).filter((t) => t.is_featured).length,
        upcoming_count: 0,
        ongoing_count: 0,
        in_whats_on_count: activeWhatsOn.filter((w) => w.content_type === "tenant")
          .length,
      },
      {
        content_type: "Blog Posts",
        total_count: (posts || []).length,
        published_count: (posts || []).filter((p) => p.is_published).length,
        featured_count: (posts || []).filter((p) => p.is_featured).length,
        upcoming_count: 0,
        ongoing_count: 0,
        in_whats_on_count: activeWhatsOn.filter((w) => w.content_type === "post")
          .length,
      },
      {
        content_type: "Promotions",
        total_count: (promotions || []).length,
        published_count: (promotions || []).filter((p) => p.status === "published")
          .length,
        featured_count: 0,
        upcoming_count: (promotions || []).filter(
          (p) =>
            p.status === "published" &&
            p.start_date &&
            new Date(p.start_date) > new Date(now)
        ).length,
        ongoing_count: (promotions || []).filter(
          (p) =>
            p.status === "published" &&
            p.start_date &&
            new Date(p.start_date) <= new Date(now) &&
            (!p.end_date || new Date(p.end_date) >= new Date(now))
        ).length,
        in_whats_on_count: activeWhatsOn.filter(
          (w) => w.content_type === "promotion"
        ).length,
      },
    ];

    return successResponse(overview);
  } catch (error) {
    console.error("Get content overview error:", error);
    return errorResponse("Failed to fetch content overview");
  }
}

// ============================================================================
// GET RECENT ACTIVITY (for dashboard widget)
// ============================================================================

export async function getRecentActivity(
  limit: number = 10
): Promise<ActionResult<ActivityLogWithUser[]>> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select(
        `
        *,
        user:admin_users!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse((data || []) as ActivityLogWithUser[]);
  } catch (error) {
    console.error("Get recent activity error:", error);
    return errorResponse("Failed to fetch recent activity");
  }
}

// ============================================================================
// GET ACTIVITY BY DAY (for charts)
// ============================================================================

export async function getActivityByDay(
  days: number = 30
): Promise<ActionResult<{ date: string; count: number }[]>> {
  try {
    const supabase = await createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    // Group by date
    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Fill in missing dates
    const result: { date: string; count: number }[] = [];
    const current = new Date(startDate);
    const today = new Date();

    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        count: grouped[dateStr] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return successResponse(result);
  } catch (error) {
    console.error("Get activity by day error:", error);
    return errorResponse("Failed to fetch activity by day");
  }
}

// ============================================================================
// GET ACTIVITY BY MODULE (for charts)
// ============================================================================

export async function getActivityByModule(): Promise<
  ActionResult<{ module: string; count: number }[]>
> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("module");

    if (error) {
      return handleSupabaseError(error);
    }

    // Group by module
    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      grouped[item.module] = (grouped[item.module] || 0) + 1;
    });

    const result = Object.entries(grouped)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count);

    return successResponse(result);
  } catch (error) {
    console.error("Get activity by module error:", error);
    return errorResponse("Failed to fetch activity by module");
  }
}

// ============================================================================
// GET ADMIN USERS (for filter dropdown)
// ============================================================================

export async function getAdminUsers(): Promise<ActionResult<AdminUserOption[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get admin users error:", error);
    return errorResponse("Failed to fetch admin users");
  }
}

// ============================================================================
// GET ANALYTICS SUMMARY (combined data for dashboard)
// ============================================================================

export async function getAnalyticsSummary(): Promise<ActionResult<AnalyticsSummary>> {
  try {
    const [statsResult, overviewResult, activityResult, byDayResult, byModuleResult] =
      await Promise.all([
        getDashboardStats(),
        getContentOverview(),
        getRecentActivity(5),
        getActivityByDay(14),
        getActivityByModule(),
      ]);

    if (!statsResult.success) {
      return errorResponse(statsResult.error || "Failed to fetch stats");
    }

    return successResponse({
      stats: statsResult.data,
      contentOverview: overviewResult.success ? overviewResult.data : [],
      recentActivity: activityResult.success
        ? activityResult.data.map((a) => ({
            activity_type: a.action,
            activity_title: a.resource_name || a.action,
            activity_subject: a.module,
            activity_category: a.resource_type || "",
            activity_date: a.created_at,
            activity_id: a.id,
          }))
        : [],
      activityByDay: byDayResult.success ? byDayResult.data : [],
      activityByModule: byModuleResult.success ? byModuleResult.data : [],
    });
  } catch (error) {
    console.error("Get analytics summary error:", error);
    return errorResponse("Failed to fetch analytics summary");
  }
}
