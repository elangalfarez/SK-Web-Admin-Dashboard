// src/components/ui/searchable-select.tsx
// World-class searchable select with buttery-smooth UX

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Check, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SearchableSelectOption {
  id: string;
  label: string;
  image?: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  selectedOption?: SearchableSelectOption | null; // Cached selected option for display
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  selectedOption: selectedOptionProp,
  placeholder = "Select an option",
  disabled = false,
  className,
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  onSearchChange,
  isSearching = false,
}: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get selected option - use cached prop if available, otherwise find in options
  const selectedOption = useMemo(
    () => selectedOptionProp || options.find((opt) => opt.id === value),
    [selectedOptionProp, options, value]
  );

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOpen]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Notify parent of search query changes with proper debouncing
  useEffect(() => {
    if (onSearchChange && isOpen) {
      onSearchChange(searchQuery);
    }
  }, [searchQuery, onSearchChange, isOpen]);

  // Smart sorting: selected item first, then alphabetically
  const sortedAndFilteredOptions = useMemo(() => {
    let filtered = options;

    // Client-side filtering only if no server-side search
    if (!onSearchChange && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = options.filter((option) =>
        option.label.toLowerCase().includes(query)
      );
    }

    // ALWAYS ensure selected option is in the list
    if (value && selectedOption && !filtered.find(opt => opt.id === value)) {
      filtered = [selectedOption, ...filtered];
    }

    // Sort: selected item first, then rest alphabetically
    return filtered.sort((a, b) => {
      // Selected item always first
      if (a.id === value) return -1;
      if (b.id === value) return 1;
      // Then alphabetically
      return a.label.localeCompare(b.label);
    });
  }, [options, searchQuery, onSearchChange, value, selectedOption]);

  // Scroll to selected item when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedElement = listRef.current.querySelector(
        `[data-value="${value}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [isOpen, value]);

  const handleSelect = useCallback(
    (newValue: string) => {
      onValueChange(newValue);
      setIsOpen(false);
      setSearchQuery(""); // Clear search on select
    },
    [onValueChange]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Select
        value={value}
        onValueChange={handleSelect}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="transition-all duration-200">
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                {selectedOption.image && (
                  <img
                    src={selectedOption.image}
                    alt=""
                    className="h-5 w-5 rounded object-cover"
                  />
                )}
                <span className="truncate">{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          className="p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (searchInputRef.current === document.activeElement) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={() => setIsOpen(false)}
        >
          {/* Search Header - Fixed */}
          <div
            className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2"
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQuery(e.target.value);
                }}
                className={cn(
                  "h-9 pl-8 pr-8 transition-all duration-200",
                  "focus:ring-2 focus:ring-primary/20"
                )}
                autoFocus
                autoComplete="off"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 0);
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && sortedAndFilteredOptions.length > 0) {
                    e.preventDefault();
                    handleSelect(sortedAndFilteredOptions[0].id);
                  }
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onInput={(e) => e.stopPropagation()}
              />
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSearch();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200 hover:scale-110",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="mt-1.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
              {isSearching ? (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching...
                </p>
              ) : sortedAndFilteredOptions.length > 0 ? (
                <p className="text-muted-foreground">
                  {sortedAndFilteredOptions.length}{" "}
                  {sortedAndFilteredOptions.length === 1 ? "item" : "items"}
                  {value && selectedOption && " • Selected: " + selectedOption.label}
                </p>
              ) : (
                <p className="text-muted-foreground">No results</p>
              )}
            </div>
          </div>

          {/* Options List - Scrollable */}
          <div
            ref={listRef}
            className="max-h-[320px] overflow-y-auto scroll-smooth overscroll-contain"
          >
            {sortedAndFilteredOptions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground animate-in fade-in duration-300">
                <div className="mb-2 flex justify-center">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                {emptyText}
              </div>
            ) : (
              <div className="p-1">
                {sortedAndFilteredOptions.map((option, index) => {
                  const isSelected = value === option.id;
                  return (
                    <SelectItem
                      key={option.id}
                      value={option.id}
                      data-value={option.id}
                      className={cn(
                        "cursor-pointer transition-all duration-150",
                        "hover:bg-accent/50",
                        "focus:bg-accent/50",
                        isSelected && "bg-accent/30",
                        "animate-in fade-in slide-in-from-top-1 duration-200",
                        // Stagger animation
                        `animation-delay-${Math.min(index, 10) * 25}`
                      )}
                      style={{
                        animationDelay: `${Math.min(index, 10) * 25}ms`,
                      }}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        {option.image && (
                          <img
                            src={option.image}
                            alt=""
                            className={cn(
                              "h-6 w-6 rounded object-cover flex-shrink-0",
                              "ring-1 ring-border transition-all duration-200",
                              isSelected && "ring-2 ring-primary"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "truncate flex-1 transition-colors duration-200",
                            isSelected && "font-medium text-foreground"
                          )}
                        >
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 text-primary animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
