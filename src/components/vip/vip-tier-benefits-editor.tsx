// src/components/vip/vip-tier-benefits-editor.tsx
// Created: Editor for assigning benefits to a VIP tier

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Gift, GripVertical, Save, Check, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVipBenefits, updateTierBenefits } from "@/actions/vip";
import type { VipTierWithBenefits, VipBenefit } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface VipTierBenefitsEditorProps {
  tier: VipTierWithBenefits;
}

interface AssignedBenefit {
  benefit_id: string;
  benefit_name: string;
  benefit_note: string;
  display_order: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VipTierBenefitsEditor({ tier }: VipTierBenefitsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [allBenefits, setAllBenefits] = useState<VipBenefit[]>([]);
  const [assignedBenefits, setAssignedBenefits] = useState<AssignedBenefit[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize assigned benefits from tier
  useEffect(() => {
    const initial = tier.benefits.map((b, index) => ({
      benefit_id: b.id,
      benefit_name: b.name,
      benefit_note: b.benefit_note || "",
      display_order: b.display_order ?? index,
    }));
    setAssignedBenefits(initial);
  }, [tier]);

  // Fetch all available benefits
  useEffect(() => {
    getVipBenefits().then((result) => {
      if (result.success) {
        setAllBenefits(result.data.filter((b) => b.is_active));
      }
    });
  }, []);

  // Get unassigned benefits for dropdown
  const unassignedBenefits = allBenefits.filter(
    (b) => !assignedBenefits.some((ab) => ab.benefit_id === b.id)
  );

  // Add benefit
  const addBenefit = (benefitId: string) => {
    const benefit = allBenefits.find((b) => b.id === benefitId);
    if (!benefit) return;

    const newBenefit: AssignedBenefit = {
      benefit_id: benefit.id,
      benefit_name: benefit.name,
      benefit_note: "",
      display_order: assignedBenefits.length,
    };

    setAssignedBenefits([...assignedBenefits, newBenefit]);
    setHasChanges(true);
  };

  // Remove benefit
  const removeBenefit = (benefitId: string) => {
    setAssignedBenefits(assignedBenefits.filter((b) => b.benefit_id !== benefitId));
    setHasChanges(true);
  };

  // Update benefit note
  const updateNote = (benefitId: string, note: string) => {
    setAssignedBenefits(
      assignedBenefits.map((b) =>
        b.benefit_id === benefitId ? { ...b, benefit_note: note } : b
      )
    );
    setHasChanges(true);
  };

  // Move benefit up
  const moveBenefitUp = (index: number) => {
    if (index <= 0) return;
    const newBenefits = [...assignedBenefits];
    [newBenefits[index - 1], newBenefits[index]] = [newBenefits[index], newBenefits[index - 1]];
    // Update display order
    newBenefits.forEach((b, i) => {
      b.display_order = i;
    });
    setAssignedBenefits(newBenefits);
    setHasChanges(true);
  };

  // Move benefit down
  const moveBenefitDown = (index: number) => {
    if (index >= assignedBenefits.length - 1) return;
    const newBenefits = [...assignedBenefits];
    [newBenefits[index], newBenefits[index + 1]] = [newBenefits[index + 1], newBenefits[index]];
    // Update display order
    newBenefits.forEach((b, i) => {
      b.display_order = i;
    });
    setAssignedBenefits(newBenefits);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    startTransition(async () => {
      const benefits = assignedBenefits.map((b) => ({
        benefit_id: b.benefit_id,
        benefit_note: b.benefit_note || null,
        display_order: b.display_order,
      }));

      const result = await updateTierBenefits(tier.id, benefits);
      if (result.success) {
        toast.success(result.message);
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Tier Benefits
          </CardTitle>
          <CardDescription>
            Assign and order benefits for this tier
          </CardDescription>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Benefit */}
        {unassignedBenefits.length > 0 && (
          <div className="flex items-center gap-2">
            <Select onValueChange={addBenefit}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a benefit..." />
              </SelectTrigger>
              <SelectContent>
                {unassignedBenefits.map((benefit) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    <span className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      {benefit.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Assigned Benefits List */}
        {assignedBenefits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No benefits assigned</p>
            <p className="text-sm">Add benefits from the dropdown above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedBenefits.map((benefit, index) => (
              <div
                key={benefit.benefit_id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card"
              >
                {/* Drag Handle */}
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

                {/* Order Controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveBenefitUp(index)}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveBenefitDown(index)}
                    disabled={index === assignedBenefits.length - 1}
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Benefit Icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                  style={{ 
                    backgroundColor: `${tier.card_color}20`,
                    color: tier.card_color,
                  }}
                >
                  <Check className="h-5 w-5" />
                </div>

                {/* Benefit Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{benefit.benefit_name}</p>
                  <Input
                    value={benefit.benefit_note}
                    onChange={(e) => updateNote(benefit.benefit_id, e.target.value)}
                    placeholder="Add a note (optional)..."
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                {/* Order Badge */}
                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBenefit(benefit.benefit_id)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {assignedBenefits.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border text-sm text-muted-foreground">
            <span>{assignedBenefits.length} benefit(s) assigned</span>
            {hasChanges && (
              <span className="text-warning flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
