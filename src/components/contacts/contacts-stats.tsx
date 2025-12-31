// src/components/contacts/contacts-stats.tsx
// Created: Contact statistics cards component

"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Mail, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getContactStats } from "@/actions/contacts";
import type { ContactStats } from "@/actions/contacts";

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              trend === "up" && "bg-success/10 text-success",
              trend === "down" && "bg-destructive/10 text-destructive",
              !trend && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactsStats() {
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getContactStats().then((result) => {
      if (result.success) {
        setStats(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Contacts"
        value={stats.total}
        icon={MessageSquare}
        description="All time submissions"
      />
      <StatCard
        title="Unread"
        value={stats.unread}
        icon={Mail}
        description="Pending review"
        trend={stats.unread > 0 ? "up" : "neutral"}
        className={stats.unread > 0 ? "border-primary/50" : ""}
      />
      <StatCard
        title="Today"
        value={stats.todayCount}
        icon={Calendar}
        description="Received today"
        trend={stats.todayCount > 0 ? "up" : "neutral"}
      />
      <StatCard
        title="This Week"
        value={stats.weekCount}
        icon={TrendingUp}
        description="Last 7 days"
      />
    </div>
  );
}
