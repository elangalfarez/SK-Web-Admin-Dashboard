// src/components/events/events-filters.tsx
// Created: Filters component for events list

"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "ended", label: "Ended" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function EventsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentFeatured = searchParams.get("featured");

  // Create updated URL with new params
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      if (!params.hasOwnProperty("page")) {
        newParams.delete("page");
      }

      return newParams.toString();
    },
    [searchParams]
  );

  // Update URL with new filters
  const updateFilters = useCallback(
    (params: Record<string, string | null>) => {
      startTransition(() => {
        const queryString = createQueryString(params);
        router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
      });
    },
    [router, pathname, createQueryString]
  );

  // Handle search input
  const handleSearch = (value: string) => {
    updateFilters({ search: value || null });
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    updateFilters({ status: value === "all" ? null : value });
  };

  // Handle featured toggle
  const handleFeaturedToggle = () => {
    updateFilters({
      featured: currentFeatured === "true" ? null : "true",
    });
  };

  // Clear all filters
  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = currentSearch || currentStatus !== "all" || currentFeatured;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search events..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
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

      {/* Featured toggle */}
      <Button
        variant={currentFeatured === "true" ? "default" : "outline"}
        onClick={handleFeaturedToggle}
        className="w-full sm:w-auto"
      >
        Featured Only
      </Button>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
