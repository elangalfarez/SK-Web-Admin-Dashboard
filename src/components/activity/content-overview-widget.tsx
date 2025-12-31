// src/components/activity/content-overview-widget.tsx
// Created: Content overview widget for dashboard

"use client";

import { Calendar, Store, FileText, Percent, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentStatsOverview } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface ContentOverviewWidgetProps {
  overview: ContentStatsOverview[];
}

// ============================================================================
// ICON MAP
// ============================================================================

const iconMap: Record<string, typeof Calendar> = {
  Events: Calendar,
  Tenants: Store,
  "Blog Posts": FileText,
  Promotions: Percent,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  Events: { bg: "bg-blue-500/10", text: "text-blue-500" },
  Tenants: { bg: "bg-green-500/10", text: "text-green-500" },
  "Blog Posts": { bg: "bg-orange-500/10", text: "text-orange-500" },
  Promotions: { bg: "bg-pink-500/10", text: "text-pink-500" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ContentOverviewWidget({ overview }: ContentOverviewWidgetProps) {
  if (overview.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {overview.map((item) => {
            const Icon = iconMap[item.content_type] || FileText;
            const colors = colorMap[item.content_type] || {
              bg: "bg-muted",
              text: "text-muted-foreground",
            };

            const publishedPercent =
              item.total_count > 0
                ? Math.round((item.published_count / item.total_count) * 100)
                : 0;

            return (
              <div key={item.content_type} className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        colors.bg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", colors.text)} />
                    </div>
                    <span className="font-medium">{item.content_type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.published_count} / {item.total_count}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={cn("h-2 rounded-full transition-all", colors.bg)}
                    style={{
                      width: `${publishedPercent}%`,
                      backgroundColor:
                        colors.text === "text-blue-500"
                          ? "rgb(59, 130, 246)"
                          : colors.text === "text-green-500"
                          ? "rgb(34, 197, 94)"
                          : colors.text === "text-orange-500"
                          ? "rgb(249, 115, 22)"
                          : "rgb(236, 72, 153)",
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-2">
                  {item.featured_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {item.featured_count} featured
                    </Badge>
                  )}
                  {item.upcoming_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {item.upcoming_count} upcoming
                    </Badge>
                  )}
                  {item.ongoing_count > 0 && (
                    <Badge variant="success" className="text-xs">
                      {item.ongoing_count} ongoing
                    </Badge>
                  )}
                  {item.in_whats_on_count > 0 && (
                    <Badge variant="info" className="text-xs">
                      {item.in_whats_on_count} in What's On
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
