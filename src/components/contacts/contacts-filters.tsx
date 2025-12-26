// src/components/contacts/contacts-filters.tsx
// Created: Filters component for contacts list

"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Mail, MailOpen, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enquiryTypes } from "@/lib/validations/contact";

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const statusOptions = [
  { value: "all", label: "All Status", icon: Filter },
  { value: "unread", label: "Unread", icon: Mail },
  { value: "read", label: "Read", icon: MailOpen },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "all";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";

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

  // Handle enquiry type change
  const handleTypeChange = (value: string) => {
    updateFilters({ type: value === "all" ? null : value });
  };

  // Handle date changes
  const handleStartDateChange = (value: string) => {
    updateFilters({ startDate: value || null });
  };

  const handleEndDateChange = (value: string) => {
    updateFilters({ endDate: value || null });
  };

  // Clear all filters
  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters =
    currentSearch ||
    currentStatus !== "all" ||
    currentType !== "all" ||
    currentStartDate ||
    currentEndDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email, message..."
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
                <span className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Enquiry type filter */}
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Enquiry Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {enquiryTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* Date range filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Date Range:</span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="date"
            value={currentStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full sm:w-auto"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={currentEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
