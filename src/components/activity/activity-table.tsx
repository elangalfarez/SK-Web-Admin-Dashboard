// src/components/activity/activity-table.tsx
// Created: Activity log table component with pagination

"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityFilters, type ActivityFiltersState } from "./activity-filters";
import { getActivityLogs } from "@/actions/analytics";
import { formatDate, formatRelativeTime } from "@/lib/utils/format-date";
import type { ActivityLogWithUser, PaginatedResult } from "@/types/database";

// ============================================================================
// ACTION ICONS & COLORS
// ============================================================================

const actionConfig: Record<
  string,
  { icon: typeof Plus; color: string; label: string }
> = {
  create: { icon: Plus, color: "text-green-500", label: "Created" },
  update: { icon: Pencil, color: "text-blue-500", label: "Updated" },
  delete: { icon: Trash2, color: "text-red-500", label: "Deleted" },
  publish: { icon: CheckCircle, color: "text-green-500", label: "Published" },
  unpublish: { icon: XCircle, color: "text-orange-500", label: "Unpublished" },
  login: { icon: LogIn, color: "text-primary", label: "Logged In" },
  logout: { icon: LogOut, color: "text-muted-foreground", label: "Logged Out" },
  read: { icon: Eye, color: "text-muted-foreground", label: "Viewed" },
  bulk_read: { icon: Eye, color: "text-muted-foreground", label: "Bulk Read" },
  bulk_delete: { icon: Trash2, color: "text-red-500", label: "Bulk Deleted" },
  reorder: { icon: RefreshCw, color: "text-blue-500", label: "Reordered" },
  toggle: { icon: RefreshCw, color: "text-orange-500", label: "Toggled" },
};

const moduleColors: Record<string, string> = {
  auth: "bg-purple-500/10 text-purple-500",
  events: "bg-blue-500/10 text-blue-500",
  tenants: "bg-green-500/10 text-green-500",
  blog: "bg-orange-500/10 text-orange-500",
  promotions: "bg-pink-500/10 text-pink-500",
  contacts: "bg-yellow-500/10 text-yellow-600",
  vip: "bg-amber-500/10 text-amber-500",
  homepage: "bg-cyan-500/10 text-cyan-500",
  settings: "bg-slate-500/10 text-slate-500",
  users: "bg-indigo-500/10 text-indigo-500",
};

// ============================================================================
// DEFAULT FILTERS
// ============================================================================

const defaultFilters: ActivityFiltersState = {
  search: "",
  action: "all",
  module: "all",
  userId: "",
  startDate: "",
  endDate: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityTable() {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ActivityFiltersState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [data, setData] = useState<PaginatedResult<ActivityLogWithUser> | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLogWithUser | null>(null);

  // Fetch data
  const fetchData = () => {
    startTransition(async () => {
      const result = await getActivityLogs({
        ...filters,
        page,
        perPage,
      });
      if (result.success) {
        setData(result.data);
      }
    });
  };

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchData();
  }, [filters, page]);

  // Reset page when filters change
  const handleFiltersChange = (newFilters: ActivityFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No activity logs found</p>
              <p className="text-sm">Activity will appear here as actions are taken.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Module
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Resource
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => {
                      const config = actionConfig[log.action] || {
                        icon: MoreHorizontal,
                        color: "text-muted-foreground",
                        label: log.action,
                      };
                      const Icon = config.icon;

                      return (
                        <tr key={log.id} className="hover:bg-muted/50">
                          {/* Action */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", config.color)} />
                              <span className="text-sm font-medium">
                                {config.label}
                              </span>
                            </div>
                          </td>

                          {/* Module */}
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                moduleColors[log.module] || ""
                              )}
                            >
                              {log.module}
                            </Badge>
                          </td>

                          {/* Resource */}
                          <td className="px-4 py-3">
                            <div className="max-w-[200px]">
                              <p className="truncate text-sm font-medium">
                                {log.resource_name || "-"}
                              </p>
                              {log.resource_type && (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {log.resource_type}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {log.user?.avatar_url ? (
                                <img
                                  src={log.user.avatar_url}
                                  alt=""
                                  className="h-6 w-6 rounded-full"
                                />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                  <User className="h-3 w-3" />
                                </div>
                              )}
                              <span className="text-sm">
                                {log.user?.full_name || "System"}
                              </span>
                            </div>
                          </td>

                          {/* Time */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span title={formatDate(log.created_at, true)}>
                                {formatRelativeTime(log.created_at)}
                              </span>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to{" "}
                  {Math.min(page * perPage, total)} of {total} entries
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedLog && <ActivityDetail log={selectedLog} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// ACTIVITY DETAIL
// ============================================================================

function ActivityDetail({ log }: { log: ActivityLogWithUser }) {
  const config = actionConfig[log.action] || {
    icon: MoreHorizontal,
    color: "text-muted-foreground",
    label: log.action,
  };
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
          )}
        >
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div>
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(log.created_at, true)}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-3 rounded-lg border border-border p-4">
        <DetailRow label="Module" value={log.module} />
        {log.resource_type && (
          <DetailRow label="Resource Type" value={log.resource_type} />
        )}
        {log.resource_name && (
          <DetailRow label="Resource Name" value={log.resource_name} />
        )}
        {log.resource_id && (
          <DetailRow label="Resource ID" value={log.resource_id} mono />
        )}
        <DetailRow
          label="User"
          value={log.user?.full_name || "System"}
          secondary={log.user?.email}
        />
        {log.ip_address && (
          <DetailRow label="IP Address" value={log.ip_address} mono />
        )}
      </div>

      {/* Changes */}
      {(log.old_values || log.new_values) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Changes</p>
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            {log.old_values && (
              <div className="mb-2">
                <p className="text-xs font-medium text-destructive">Before:</p>
                <pre className="mt-1 overflow-auto text-xs">
                  {JSON.stringify(log.old_values, null, 2)}
                </pre>
              </div>
            )}
            {log.new_values && (
              <div>
                <p className="text-xs font-medium text-green-500">After:</p>
                <pre className="mt-1 overflow-auto text-xs">
                  {JSON.stringify(log.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Metadata</p>
          <pre className="overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-xs">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  secondary,
  mono,
}: {
  label: string;
  value: string;
  secondary?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={cn("text-sm", mono && "font-mono text-xs")}>
          {value}
        </span>
        {secondary && (
          <p className="text-xs text-muted-foreground">{secondary}</p>
        )}
      </div>
    </div>
  );
}
