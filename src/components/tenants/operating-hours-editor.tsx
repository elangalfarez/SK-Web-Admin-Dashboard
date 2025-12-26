// src/components/tenants/operating-hours-editor.tsx
// Created: Operating hours editor component for tenants

"use client";

import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { OperatingHours } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface OperatingHoursEditorProps {
  value: OperatingHours | null;
  onChange: (hours: OperatingHours | null) => void;
  disabled?: boolean;
}

interface HoursEntry {
  id: string;
  days: string;
  hours: string;
}

// ============================================================================
// PRESET OPTIONS
// ============================================================================

const dayPresets = [
  { value: "mon-sun", label: "Monday - Sunday (Every day)" },
  { value: "mon-fri", label: "Monday - Friday (Weekdays)" },
  { value: "sat-sun", label: "Saturday - Sunday (Weekend)" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
  { value: "public-holiday", label: "Public Holidays" },
];

const timePresets = [
  "10:00-22:00",
  "10:00-21:00",
  "09:00-22:00",
  "11:00-22:00",
  "10:00-23:00",
  "24 hours",
  "Closed",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseOperatingHours(hours: OperatingHours | null): HoursEntry[] {
  if (!hours || Object.keys(hours).length === 0) {
    return [{ id: crypto.randomUUID(), days: "mon-sun", hours: "10:00-22:00" }];
  }

  return Object.entries(hours).map(([days, hoursValue]) => ({
    id: crypto.randomUUID(),
    days,
    hours: hoursValue,
  }));
}

function entriesToOperatingHours(entries: HoursEntry[]): OperatingHours | null {
  const validEntries = entries.filter((e) => e.days && e.hours);
  if (validEntries.length === 0) return null;

  return validEntries.reduce((acc, entry) => {
    acc[entry.days] = entry.hours;
    return acc;
  }, {} as OperatingHours);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OperatingHoursEditor({
  value,
  onChange,
  disabled = false,
}: OperatingHoursEditorProps) {
  const [entries, setEntries] = useState<HoursEntry[]>(() =>
    parseOperatingHours(value)
  );

  const updateEntries = (newEntries: HoursEntry[]) => {
    setEntries(newEntries);
    onChange(entriesToOperatingHours(newEntries));
  };

  const addEntry = () => {
    const newEntry: HoursEntry = {
      id: crypto.randomUUID(),
      days: "",
      hours: "10:00-22:00",
    };
    updateEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    updateEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: "days" | "hours", value: string) => {
    updateEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Operating Hours
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEntry}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Hours
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border p-3",
              disabled && "opacity-50"
            )}
          >
            {/* Days selector */}
            <Select
              value={entry.days}
              onValueChange={(value) => updateEntry(entry.id, "days", value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {dayPresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Hours input */}
            <div className="flex-1">
              <Input
                value={entry.hours}
                onChange={(e) => updateEntry(entry.id, "hours", e.target.value)}
                placeholder="e.g., 10:00-22:00"
                disabled={disabled}
                list={`time-presets-${entry.id}`}
              />
              <datalist id={`time-presets-${entry.id}`}>
                {timePresets.map((time) => (
                  <option key={time} value={time} />
                ))}
              </datalist>
            </div>

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeEntry(entry.id)}
              disabled={disabled || entries.length <= 1}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Use 24-hour format (e.g., 10:00-22:00). Add multiple entries for different days.
      </p>
    </div>
  );
}
