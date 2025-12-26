// src/app/(dashboard)/promotions/[id]/page.tsx
// Created: Promotion detail/view page

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Tag,
  Store,
  Calendar,
  Clock,
  Pencil,
  ArrowLeft,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPromotion } from "@/actions/promotions";
import { formatDisplayDate, formatRelativeDate, getPromotionDateStatus } from "@/lib/utils/format-date";
import type { PromotionStatus } from "@/types/database";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPromotion(id);

  if (!result.success || !result.data) {
    return { title: "Promotion Not Found" };
  }

  return {
    title: result.data.title,
  };
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: PromotionStatus }) {
  const config: Record<PromotionStatus, { variant: "published" | "draft" | "inactive"; label: string; icon: React.ReactNode }> = {
    published: { variant: "published", label: "Published", icon: <PlayCircle className="mr-1 h-3 w-3" /> },
    staging: { variant: "draft", label: "Staging", icon: <PauseCircle className="mr-1 h-3 w-3" /> },
    expired: { variant: "inactive", label: "Expired", icon: <XCircle className="mr-1 h-3 w-3" /> },
  };

  const { variant, label, icon } = config[status];

  return (
    <Badge variant={variant}>
      {icon}
      {label}
    </Badge>
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPromotion(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const promotion = result.data;
  const dateStatus = getPromotionDateStatus(
    promotion.start_date || undefined,
    promotion.end_date || undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/promotions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{promotion.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={promotion.status} />
              {promotion.status === "published" && dateStatus !== "active" && (
                <Badge variant={dateStatus === "upcoming" ? "upcoming" : "ended"}>
                  {dateStatus === "upcoming" ? "Upcoming" : "Ended"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/promotions/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Promotion
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Promotion Image */}
          {promotion.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <img
                src={promotion.image_url}
                alt={promotion.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {promotion.full_description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {promotion.full_description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Source Link */}
          {promotion.source_post && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={promotion.source_post}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <span className="truncate">{promotion.source_post}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Info */}
          {promotion.tenant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {promotion.tenant.logo_url ? (
                    <img
                      src={promotion.tenant.logo_url}
                      alt={promotion.tenant.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{promotion.tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {promotion.tenant.tenant_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {promotion.start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDate(promotion.start_date)}
                    </p>
                  </div>
                </div>
              )}
              {promotion.end_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDate(promotion.end_date)}
                    </p>
                  </div>
                </div>
              )}
              {!promotion.start_date && !promotion.end_date && (
                <p className="text-sm text-muted-foreground">No validity dates set</p>
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
                <span>{formatRelativeDate(promotion.created_at)}</span>
              </div>
              {promotion.published_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span>{formatRelativeDate(promotion.published_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{promotion.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
