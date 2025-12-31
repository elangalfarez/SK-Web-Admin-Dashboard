// src/components/users/users-filters.tsx
// Created: User filters component

"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getRoles } from "@/actions/users";
import type { AdminRole } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface UsersFiltersState {
  search: string;
  status: string;
  roleId: string;
}

interface UsersFiltersProps {
  filters: UsersFiltersState;
  onFiltersChange: (filters: UsersFiltersState) => void;
  onReset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function UsersFilters({
  filters,
  onFiltersChange,
  onReset,
}: UsersFiltersProps) {
  const [roles, setRoles] = useState<AdminRole[]>([]);

  // Load roles for filter
  useEffect(() => {
    getRoles().then((result) => {
      if (result.success) {
        setRoles(result.data);
      }
    });
  }, []);

  // Count active filters
  const activeFilterCount = [
    filters.status !== "all" && filters.status,
    filters.roleId,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select
          value={filters.roleId || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              roleId: value === "all" ? "" : value,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  {role.display_name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: "all" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.roleId && (
            <Badge variant="secondary" className="gap-1">
              Role: {roles.find((r) => r.id === filters.roleId)?.display_name || "Selected"}
              <button
                onClick={() => onFiltersChange({ ...filters, roleId: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
