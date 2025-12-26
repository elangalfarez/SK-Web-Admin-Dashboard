// src/components/blog/blog-filters.tsx
// Created: Filters component for blog posts list

"use client";

import { useCallback, useTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories } from "@/actions/blog";
import type { BlogCategory } from "@/types/database";

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BlogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "all";
  const currentFeatured = searchParams.get("featured");

  // Fetch categories on mount
  useEffect(() => {
    getCategories().then((result) => {
      if (result.success) {
        setCategories(result.data);
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

  const hasFilters = currentSearch || currentStatus !== "all" || currentCategory !== "all" || currentFeatured;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select value={currentStatus} onValueChange={handleStatusChange}>
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

      {/* Category filter */}
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
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
                {category.name}
              </span>
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
