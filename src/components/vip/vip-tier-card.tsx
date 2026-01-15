// src/components/vip/vip-tier-card.tsx
// Created: VIP tier card component displaying tier info and benefits

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { RequirePermission } from "@/components/providers/auth-provider";
import {
  Crown,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Gift,
  Check,
  MoreHorizontal,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteVipTier, toggleVipTierStatus } from "@/actions/vip";
import type { VipTierWithBenefits } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface VipTierCardProps {
  tier: VipTierWithBenefits;
  expanded?: boolean;
}

// ============================================================================
// HELPER - Format currency
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VipTierCard({ tier, expanded = false }: VipTierCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  const handleToggleStatus = () => {
    setShowToggleDialog(true);
  };

  const handleConfirmToggle = () => {
    startTransition(async () => {
      const result = await toggleVipTierStatus(tier.id, !tier.is_active);
      if (result.success) {
        toast.success(result.message);
        setShowToggleDialog(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteVipTier(tier.id);
      if (result.success) {
        toast.success(result.message);
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all",
          tier.is_active
            ? "border-border bg-card hover:shadow-lg"
            : "border-border/50 bg-muted/30 opacity-75",
          isPending && "pointer-events-none opacity-50"
        )}
      >
        {/* Card Color Accent */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: tier.card_color }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-4 pt-5">
          <div className="flex items-start gap-3">
            {/* Tier Icon */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ 
                backgroundColor: `${tier.card_color}20`,
                color: tier.card_color,
              }}
            >
              <Crown className="h-6 w-6" />
            </div>

            {/* Tier Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-lg">{tier.name}</h3>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: tier.card_color,
                    color: tier.card_color,
                  }}
                >
                  Level {tier.tier_level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {tier.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/vip/tiers/${tier.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <RequirePermission module="dashboard" action="edit">
                <DropdownMenuItem asChild>
                  <Link href={`/vip/tiers/${tier.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Tier
                  </Link>
                </DropdownMenuItem>
              </RequirePermission>
              <RequirePermission module="dashboard" action="edit">
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {tier.is_active ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              </RequirePermission>
              <RequirePermission module="dashboard" action="delete">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </RequirePermission>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Requirements */}
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Min. Spend:</span>
              <span className="ml-1 font-medium">
                {formatCurrency(tier.minimum_spend_amount)}
              </span>
            </div>
            {tier.minimum_receipt_amount && (
              <div>
                <span className="text-muted-foreground">Min. Receipt:</span>
                <span className="ml-1 font-medium">
                  {formatCurrency(tier.minimum_receipt_amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Benefits */}
        {(expanded || tier.benefits.length <= 4) && tier.benefits.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Benefits ({tier.benefits.length})</span>
            </div>
            <ul className="space-y-2">
              {tier.benefits.map((benefit) => (
                <li key={benefit.id} className="flex items-start gap-2 text-sm">
                  <Check 
                    className="h-4 w-4 mt-0.5 shrink-0" 
                    style={{ color: tier.card_color }}
                  />
                  <div>
                    <span>{benefit.name}</span>
                    {benefit.benefit_note && (
                      <span className="text-muted-foreground ml-1">
                        ({benefit.benefit_note})
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collapsed Benefits Summary */}
        {!expanded && tier.benefits.length > 4 && (
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{tier.benefits.length} Benefits</span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/vip/tiers/${tier.id}`}>
                  View All
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* No Benefits */}
        {tier.benefits.length === 0 && (
          <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
            <Gift className="mx-auto h-8 w-8 opacity-30 mb-2" />
            No benefits assigned
          </div>
        )}

        {/* Status Indicator */}
        {!tier.is_active && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] pointer-events-none">
            <Badge variant="inactive" className="text-sm">
              <PowerOff className="mr-1 h-3 w-3" />
              Inactive
            </Badge>
          </div>
        )}
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tier.is_active ? "Deactivate" : "Activate"} VIP Tier
            </DialogTitle>
            <DialogDescription>
              {tier.is_active ? (
                <>
                  Are you sure you want to deactivate the "{tier.name}" tier?{" "}
                  <strong>This will hide the tier from the VIP Cards page</strong> and prevent
                  new members from registering for this tier. Existing members will retain their status.
                </>
              ) : (
                <>
                  Are you sure you want to activate the "{tier.name}" tier?
                  This will make the tier visible on the VIP Cards page and allow
                  new members to register for this tier.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowToggleDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmToggle}
              disabled={isPending}
            >
              {isPending
                ? (tier.is_active ? "Deactivating..." : "Activating...")
                : (tier.is_active ? "Deactivate" : "Activate")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete VIP Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{tier.name}" tier?
              This will also remove all benefit assignments for this tier.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
