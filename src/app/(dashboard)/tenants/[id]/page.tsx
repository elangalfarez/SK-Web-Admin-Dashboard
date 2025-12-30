// src/app/(dashboard)/tenants/[id]/page.tsx
// Created: Tenant detail/view page

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Store,
  Building2,
  Phone,
  Clock,
  Pencil,
  ArrowLeft,
  Star,
  Sparkles,
  Power,
  PowerOff,
  FolderOpen,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenant } from "@/actions/tenants";
import { getPromotions } from "@/actions/promotions";
import { formatRelativeDate } from "@/lib/utils/format-date";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getTenant(id);

  if (!result.success || !result.data) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: result.data.name,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTenant(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const tenant = result.data;

  // Fetch tenant's promotions
  const promotionsResult = await getPromotions({
    tenantId: tenant.id,
    page: 1,
    perPage: 5,
  });

  const promotions = promotionsResult.success ? promotionsResult.data.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tenants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{tenant.name}</h1>
                {tenant.is_featured && (
                  <Star className="h-5 w-5 fill-primary text-primary" />
                )}
                {tenant.is_new_tenant && (
                  <Badge variant="info">
                    <Sparkles className="mr-1 h-3 w-3" />
                    New
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{tenant.tenant_code}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={tenant.is_active ? "success" : "inactive"}>
                  {tenant.is_active ? (
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
                {tenant.category && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: tenant.category.color ? `${tenant.category.color}20` : undefined,
                      borderColor: tenant.category.color || undefined,
                      color: tenant.category.color || undefined,
                    }}
                  >
                    {tenant.category.display_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/tenants/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Tenant
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Banner */}
          {tenant.banner_url && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <img
                src={tenant.banner_url}
                alt={tenant.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {tenant.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {tenant.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Promotions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Promotions
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/promotions?tenant=${tenant.id}`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {promotions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No promotions for this tenant
                </p>
              ) : (
                <div className="space-y-3">
                  {promotions.map((promo) => (
                    <Link
                      key={promo.id}
                      href={`/promotions/${promo.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      {promo.image_url ? (
                        <img
                          src={promo.image_url}
                          alt={promo.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{promo.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {promo.status}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Floor</p>
                  <p className="text-sm text-muted-foreground">{tenant.main_floor}</p>
                </div>
              </div>
              {tenant.category && (
                <div className="flex items-start gap-3">
                  <FolderOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">{tenant.category.display_name}</p>
                  </div>
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operating Hours */}
          {tenant.operating_hours && Object.keys(tenant.operating_hours).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(tenant.operating_hours).map(([days, hours]) => (
                    <div key={days} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {days.replace(/-/g, " - ")}
                      </span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatRelativeDate(tenant.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatRelativeDate(tenant.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {tenant.tenant_code}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
