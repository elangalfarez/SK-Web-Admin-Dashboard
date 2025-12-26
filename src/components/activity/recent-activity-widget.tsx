// src/components/activity/recent-activity-widget.tsx
// Created: Recent activity widget for dashboard

"use client";

import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  ArrowRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format-date";
import type { ActivityLogWithUser } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface RecentActivityWidgetProps {
  activities: ActivityLogWithUser[];
}

// ============================================================================
// ACTION CONFIG
// ============================================================================

const actionConfig: Record<
  string,
  { icon: typeof Plus; color: string; bgColor: string }
> = {
  create: { icon: Plus, color: "text-green-500", bgColor: "bg-green-500/10" },
  update: { icon: Pencil, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  delete: { icon: Trash2, color: "text-red-500", bgColor: "bg-red-500/10" },
  publish: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  unpublish: { icon: XCircle, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  login: { icon: LogIn, color: "text-primary", bgColor: "bg-primary/10" },
  logout: { icon: LogOut, color: "text-muted-foreground", bgColor: "bg-muted" },
  read: { icon: Eye, color: "text-muted-foreground", bgColor: "bg-muted" },
  reorder: { icon: RefreshCw, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  toggle: { icon: RefreshCw, color: "text-orange-500", bgColor: "bg-orange-500/10" },
};

// ============================================================================
// ACTION LABEL
// ============================================================================

function getActionLabel(action: string, module: string, resourceName?: string | null): string {
  const name = resourceName || module;
  
  switch (action) {
    case "create":
      return `Created ${name}`;
    case "update":
      return `Updated ${name}`;
    case "delete":
      return `Deleted ${name}`;
    case "publish":
      return `Published ${name}`;
    case "unpublish":
      return `Unpublished ${name}`;
    case "login":
      return "Logged in";
    case "logout":
      return "Logged out";
    case "read":
      return `Viewed ${name}`;
    case "reorder":
      return `Reordered ${module}`;
    case "toggle":
      return `Toggled ${name}`;
    default:
      return `${action} ${name}`;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as actions are taken.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activity">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map((activity) => {
            const config = actionConfig[activity.action] || {
              icon: MoreHorizontal,
              color: "text-muted-foreground",
              bgColor: "bg-muted",
            };
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-6 py-3 hover:bg-muted/50"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {getActionLabel(
                      activity.action,
                      activity.module,
                      activity.resource_name
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {/* User */}
                    <span className="flex items-center gap-1">
                      {activity.user?.avatar_url ? (
                        <img
                          src={activity.user.avatar_url}
                          alt=""
                          className="h-4 w-4 rounded-full"
                        />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {activity.user?.full_name || "System"}
                    </span>
                    <span>•</span>
                    {/* Time */}
                    <span>{formatRelativeTime(activity.created_at)}</span>
                  </div>
                </div>

                {/* Module Badge */}
                <Badge variant="outline" className="shrink-0 text-xs capitalize">
                  {activity.module}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
