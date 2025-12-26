// src/components/tenants/tenants-filters.tsx
// Created: Filters component for tenants list

"use client";

import { useCallback, useTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, FolderOpen, Building2, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTenantCategories, getMallFloors } from "@/actions/tenants";
import type { TenantCategory, MallFloor } from "@/types/database";

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TenantsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<TenantCategory[]>([]);
  const [floors, setFloors] = useState<MallFloor[]>([]);

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "all";
  const currentFloor = searchParams.get("floor") || "all";
  const currentFeatured = searchParams.get("featured");
  const currentNew = searchParams.get("new");

  // Fetch categories and floors on mount
  useEffect(() => {
    getTenantCategories().then((result) => {
      if (result.success) {
        setCategories(result.data);
      }
    });

    getMallFloors().then((result) => {
      if (result.success) {
        setFloors(result.data);
      }
    });
  }, []);

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

  // Handle category change
  const handleCategoryChange = (value: string) => {
    updateFilters({ category: value === "all" ? null : value });
  };

  // Handle floor change
  const handleFloorChange = (value: string) => {
    updateFilters({ floor: value === "all" ? null : value });
  };

  // Handle featured toggle
  const handleFeaturedToggle = () => {
    updateFilters({
      featured: currentFeatured === "true" ? null : "true",
    });
  };

  // Handle new tenant toggle
  const handleNewToggle = () => {
    updateFilters({
      new: currentNew === "true" ? null : "true",
    });
  };

  // Clear all filters
  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = currentSearch || currentStatus !== "all" || currentCategory !== "all" || currentFloor !== "all" || currentFeatured || currentNew;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tenants..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[130px]">
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

      {/* Category filter */}
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <FolderOpen className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <span className="flex items-center gap-2">
                {category.color && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {category.display_name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Floor filter */}
      <Select value={currentFloor} onValueChange={handleFloorChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Floors</SelectItem>
          {floors.map((floor) => (
            <SelectItem key={floor.id} value={floor.floor_code}>
              {floor.floor_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Featured toggle */}
      <Button
        variant={currentFeatured === "true" ? "default" : "outline"}
        size="sm"
        onClick={handleFeaturedToggle}
        className="w-full sm:w-auto"
      >
        <Star className="mr-2 h-4 w-4" />
        Featured
      </Button>

      {/* New tenant toggle */}
      <Button
        variant={currentNew === "true" ? "default" : "outline"}
        size="sm"
        onClick={handleNewToggle}
        className="w-full sm:w-auto"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        New
      </Button>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
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
