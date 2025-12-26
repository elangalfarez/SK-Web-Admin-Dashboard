// src/components/activity/activity-filters.tsx
// Created: Activity log filters component

"use client";

import { useState, useEffect } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getAdminUsers } from "@/actions/analytics";
import type { AdminUserOption } from "@/actions/analytics";

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityFiltersState {
  search: string;
  action: string;
  module: string;
  userId: string;
  startDate: string;
  endDate: string;
}

interface ActivityFiltersProps {
  filters: ActivityFiltersState;
  onFiltersChange: (filters: ActivityFiltersState) => void;
  onReset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "publish", label: "Publish" },
  { value: "unpublish", label: "Unpublish" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "read", label: "Read" },
  { value: "bulk_read", label: "Bulk Read" },
  { value: "bulk_delete", label: "Bulk Delete" },
  { value: "reorder", label: "Reorder" },
  { value: "toggle", label: "Toggle" },
];

const moduleOptions = [
  { value: "all", label: "All Modules" },
  { value: "auth", label: "Authentication" },
  { value: "events", label: "Events" },
  { value: "tenants", label: "Tenants" },
  { value: "blog", label: "Blog" },
  { value: "promotions", label: "Promotions" },
  { value: "contacts", label: "Contacts" },
  { value: "vip", label: "VIP Cards" },
  { value: "homepage", label: "Homepage" },
  { value: "settings", label: "Settings" },
  { value: "users", label: "Users" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityFilters({
  filters,
  onFiltersChange,
  onReset,
}: ActivityFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserOption[]>([]);

  // Load admin users for filter
  useEffect(() => {
    getAdminUsers().then((result) => {
      if (result.success) {
        setAdminUsers(result.data);
      }
    });
  }, []);

  // Count active filters
  const activeFilterCount = [
    filters.action !== "all" && filters.action,
    filters.module !== "all" && filters.module,
    filters.userId,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>

        {/* Module Filter */}
        <Select
          value={filters.module}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, module: value })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {moduleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Filter */}
        <Select
          value={filters.action}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, action: value })
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(true)}
          className="relative"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="primary"
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Reset */}
        {(filters.search || activeFilterCount > 0) && (
          <Button variant="ghost" size="icon" onClick={onReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.action !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Action: {filters.action}
              <button
                onClick={() => onFiltersChange({ ...filters, action: "all" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.module !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Module: {filters.module}
              <button
                onClick={() => onFiltersChange({ ...filters, module: "all" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.userId && (
            <Badge variant="secondary" className="gap-1">
              User: {adminUsers.find((u) => u.id === filters.userId)?.full_name || "Selected"}
              <button
                onClick={() => onFiltersChange({ ...filters, userId: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.startDate && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.startDate}
              <button
                onClick={() => onFiltersChange({ ...filters, startDate: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.endDate}
              <button
                onClick={() => onFiltersChange({ ...filters, endDate: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User Filter */}
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    userId: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {adminUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onReset}>
              Reset All
            </Button>
            <Button onClick={() => setShowAdvanced(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
