// src/components/activity/activity-chart.tsx
// Created: Activity chart component using CSS bars

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

interface ActivityChartProps {
  data: { date: string; count: number }[];
  title?: string;
}

interface ModuleChartProps {
  data: { module: string; count: number }[];
  title?: string;
}

// ============================================================================
// MODULE COLORS
// ============================================================================

const moduleColors: Record<string, string> = {
  auth: "bg-purple-500",
  events: "bg-blue-500",
  tenants: "bg-green-500",
  blog: "bg-orange-500",
  promotions: "bg-pink-500",
  contacts: "bg-yellow-500",
  vip: "bg-amber-500",
  homepage: "bg-cyan-500",
  settings: "bg-slate-500",
  users: "bg-indigo-500",
};

// ============================================================================
// ACTIVITY CHART (BAR CHART)
// ============================================================================

export function ActivityChart({ data, title = "Activity (Last 14 Days)" }: ActivityChartProps) {
  const { chartData } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return {
      chartData: data.map((d) => ({
        ...d,
        height: (d.count / max) * 100,
        label: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    };
  }, [data]);

  const totalActivity = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Badge variant="secondary">{totalActivity} total</Badge>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No activity data available
          </div>
        ) : (
          <div className="space-y-2">
            {/* Chart */}
            <div className="flex h-32 items-end gap-1">
              {chartData.map((item, _index) => (
                <div
                  key={item.date}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                    <p className="font-medium">{item.count}</p>
                    <p className="text-muted-foreground">{item.label}</p>
                  </div>
                  {/* Bar */}
                  <div
                    className={cn(
                      "w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary",
                      item.count === 0 && "bg-muted"
                    )}
                    style={{ height: `${Math.max(item.height, 2)}%` }}
                  />
                </div>
              ))}
            </div>
            {/* X-axis labels */}
            <div className="flex gap-1 text-[10px] text-muted-foreground">
              {chartData.map((item, _index) => (
                <div key={item.date} className="flex-1 text-center truncate">
                  {_index === 0 || _index === chartData.length - 1
                    ? item.label
                    : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MODULE CHART (HORIZONTAL BAR CHART)
// ============================================================================

export function ModuleChart({ data, title = "Activity by Module" }: ModuleChartProps) {
  const { chartData } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    return {
      chartData: data.slice(0, 6).map((d) => ({
        ...d,
        width: (d.count / max) * 100,
        percentage: ((d.count / total) * 100).toFixed(1),
      })),
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No activity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {chartData.map((item) => (
          <div key={item.module} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize">{item.module}</span>
              <span className="text-muted-foreground">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  moduleColors[item.module] || "bg-primary"
                )}
                style={{ width: `${item.width}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
