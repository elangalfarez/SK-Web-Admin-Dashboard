// src/app/(dashboard)/vip/tiers/[id]/page.tsx
// Created: VIP tier detail page with benefits

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Crown,
  Pencil,
  ArrowLeft,
  DollarSign,
  Gift,
  Check,
  Power,
  PowerOff,
} from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VipTierBenefitsEditor } from "@/components/vip/vip-tier-benefits-editor";
import { getVipTier } from "@/actions/vip";
import { formatRelativeDate } from "@/lib/utils/format-date";

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
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getVipTier(id);

  if (!result.success || !result.data) {
    return { title: "Tier Not Found" };
  }

  return {
    title: `${result.data.name} - VIP Tier`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function VipTierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVipTier(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const tier = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vip">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            {/* Tier Icon */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl"
              style={{ 
                backgroundColor: `${tier.card_color}20`,
                color: tier.card_color,
              }}
            >
              <Crown className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{tier.name}</h1>
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: tier.card_color,
                    color: tier.card_color,
                  }}
                >
                  Level {tier.tier_level}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{tier.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={tier.is_active ? "success" : "inactive"}>
                  {tier.is_active ? (
                    <>
                      <Power className="mr-1 h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <PowerOff className="mr-1 h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/vip/tiers/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Tier
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="aspect-[1.6/1] max-w-sm rounded-xl p-6 text-white shadow-lg flex flex-col justify-between"
                style={{ 
                  backgroundColor: tier.card_color,
                  backgroundImage: `linear-gradient(135deg, ${tier.card_color} 0%, ${tier.card_color}cc 100%)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm opacity-75">VIP Member</p>
                    <p className="text-xl font-display font-bold">{tier.name}</p>
                  </div>
                  <Crown className="h-8 w-8" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-75">Member Since</p>
                    <p className="text-sm font-medium">Jan 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">Card Number</p>
                    <p className="text-sm font-mono">**** **** **** 1234</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Editor */}
          <VipTierBenefitsEditor tier={tier} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Qualification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Qualification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Minimum Spend</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(tier.minimum_spend_amount)}
                </p>
              </div>
              {tier.minimum_receipt_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Receipt</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(tier.minimum_receipt_amount)}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">Requirement</p>
                <p className="text-sm mt-1">{tier.qualification_requirement}</p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Benefits Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tier.benefits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No benefits assigned yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit.id} className="flex items-start gap-2 text-sm">
                      <Check 
                        className="h-4 w-4 mt-0.5 shrink-0" 
                        style={{ color: tier.card_color }}
                      />
                      <span>{benefit.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatRelativeDate(tier.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatRelativeDate(tier.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sort Order</span>
                <span>{tier.sort_order}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
