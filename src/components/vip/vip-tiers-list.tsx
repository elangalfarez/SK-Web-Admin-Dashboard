// src/components/vip/vip-tiers-list.tsx
// Created: Client component for VIP tiers list with filtering

"use client";

import { AlertCircle, Power } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VipTierCard } from "@/components/vip/vip-tier-card";
import type { VipTierWithBenefits } from "@/types/database";

interface VipTiersListProps {
  tiers: VipTierWithBenefits[];
}

export function VipTiersList({ tiers }: VipTiersListProps) {
  const activeTiers = tiers.filter((tier) => tier.is_active);
  const inactiveTiers = tiers.filter((tier) => !tier.is_active);

  return (
    <div className="space-y-8">
      {/* Inactive Tiers Alert - Show prominently at top */}
      {inactiveTiers.length > 0 && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            {inactiveTiers.length} Inactive {inactiveTiers.length === 1 ? 'Tier' : 'Tiers'} Found
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            You have {inactiveTiers.length} deactivated {inactiveTiers.length === 1 ? 'tier' : 'tiers'} that {inactiveTiers.length === 1 ? 'is' : 'are'} hidden from the VIP Cards page.
            You can reactivate {inactiveTiers.length === 1 ? 'it' : 'them'} below.
          </AlertDescription>
        </Alert>
      )}

      {/* Inactive Tiers Section - Always show if there are any */}
      {inactiveTiers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Power className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Inactive Tiers</h2>
              <p className="text-sm text-muted-foreground">
                {inactiveTiers.length} {inactiveTiers.length === 1 ? 'tier is' : 'tiers are'} currently deactivated. Click the menu to reactivate.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inactiveTiers.map((tier) => (
              <VipTierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      )}

      {/* Active Tiers Section */}
      {activeTiers.length > 0 && (
        <div className="space-y-4">
          {inactiveTiers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Power className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Active Tiers</h2>
                <p className="text-sm text-muted-foreground">
                  {activeTiers.length} {activeTiers.length === 1 ? 'tier is' : 'tiers are'} currently active and visible to members.
                </p>
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeTiers.map((tier) => (
              <VipTierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
