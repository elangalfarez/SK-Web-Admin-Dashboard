// src/components/activity/dashboard-stats.tsx
// Created: Dashboard statistics cards component

"use client";

import Link from "next/link";
import {
  Calendar,
  Store,
  FileText,
  Percent,
  MessageSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardStats as DashboardStatsType } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

interface StatCardProps {
  title: string;
  value: number;
  subValue?: number;
  subLabel?: string;
  icon: typeof Calendar;
  iconColor: string;
  href: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  title,
  value,
  subValue,
  subLabel,
  icon: Icon,
  iconColor,
  href,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {subValue !== undefined && subLabel && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{subValue}</span>{" "}
                {subLabel}
              </p>
            )}
            {trend && trendValue && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <Link
          href={href}
          className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`View ${title}`}
        />
        <div className="mt-3 flex items-center text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <span>View all</span>
          <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Events */}
      <StatCard
        title="Events"
        value={stats.totalEvents}
        subValue={stats.upcomingEvents}
        subLabel="upcoming"
        icon={Calendar}
        iconColor="bg-blue-500/10 text-blue-500"
        href="/events"
      />

      {/* Tenants */}
      <StatCard
        title="Tenants"
        value={stats.totalTenants}
        subValue={stats.activeTenants}
        subLabel="active"
        icon={Store}
        iconColor="bg-green-500/10 text-green-500"
        href="/tenants"
      />

      {/* Blog Posts */}
      <StatCard
        title="Blog Posts"
        value={stats.totalPosts}
        subValue={stats.publishedPosts}
        subLabel="published"
        icon={FileText}
        iconColor="bg-orange-500/10 text-orange-500"
        href="/blog"
      />

      {/* Promotions */}
      <StatCard
        title="Promotions"
        value={stats.totalPromotions}
        subValue={stats.activePromotions}
        subLabel="active"
        icon={Percent}
        iconColor="bg-pink-500/10 text-pink-500"
        href="/promotions"
      />

      {/* Contacts */}
      <StatCard
        title="Contacts"
        value={stats.totalContacts}
        subValue={stats.unreadContacts}
        subLabel="unread"
        icon={MessageSquare}
        iconColor="bg-yellow-500/10 text-yellow-600"
        href="/contacts"
      />

      {/* VIP Tiers */}
      <StatCard
        title="VIP Tiers"
        value={stats.totalVipTiers}
        subValue={stats.activeVipTiers}
        subLabel="active"
        icon={CreditCard}
        iconColor="bg-purple-500/10 text-purple-500"
        href="/vip"
      />
    </div>
  );
}
