// src/components/shared/tag-input.tsx
// Created: Tag input component with autocomplete

"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = "Add tag...",
  maxTags = 20,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(suggestion)
    )
    .slice(0, 5);

  // Add tag
  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
        onChange([...value, trimmedTag]);
        setInputValue("");
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [value, onChange, maxTags]
  );

  // Remove tag
  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [value, onChange]
  );

  // Handle input key events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        addTag(filteredSuggestions[selectedIndex]);
      } else if (inputValue) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tags */}
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1 text-sm"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {/* Input */}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className={cn(
              "min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed"
            )}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover p-1 shadow-md">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
            >
              <Plus className="h-3 w-3" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Tag count */}
      <p className="mt-1 text-xs text-muted-foreground">
        {value.length}/{maxTags} tags
      </p>
    </div>
  );
}
