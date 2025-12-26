// src/app/(dashboard)/homepage/page.tsx
// Created: Homepage content overview page

import { Suspense } from "react";
import Link from "next/link";
import {
  Sparkles,
  UtensilsCrossed,
  ArrowRight,
  Eye,
  Calendar,
  Store,
  FileText,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWhatsOnItems, getFeaturedRestaurants } from "@/actions/homepage";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// CONTENT TYPE ICONS
// ============================================================================

const contentTypeIcons: Record<string, typeof Calendar> = {
  event: Calendar,
  tenant: Store,
  post: FileText,
  promotion: Percent,
  custom: Sparkles,
};

// ============================================================================
// OVERVIEW CONTENT
// ============================================================================

async function OverviewContent() {
  const [whatsOnResult, restaurantsResult] = await Promise.all([
    getWhatsOnItems(),
    getFeaturedRestaurants(),
  ]);

  const whatsOnItems = whatsOnResult.success ? whatsOnResult.data : [];
  const restaurants = restaurantsResult.success ? restaurantsResult.data : [];

  const activeWhatsOn = whatsOnItems.filter((item) => item.is_active);
  const activeRestaurants = restaurants.filter((item) => item.is_active);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">What's On Items</p>
                <p className="text-2xl font-bold">{activeWhatsOn.length}</p>
                <p className="text-xs text-muted-foreground">
                  of {whatsOnItems.length} total
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Featured Restaurants</p>
                <p className="text-2xl font-bold">{activeRestaurants.length}</p>
                <p className="text-xs text-muted-foreground">
                  of {restaurants.length} total
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Previews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* What's On Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                What's On
              </CardTitle>
              <CardDescription>Featured homepage content</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/homepage/whats-on">
                Manage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeWhatsOn.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No active items</p>
                <Link
                  href="/homepage/whats-on"
                  className="text-sm text-primary hover:underline"
                >
                  Add items →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeWhatsOn.slice(0, 4).map((item, index) => {
                  const Icon = contentTypeIcons[item.content_type] || Sparkles;
                  const title =
                    item.custom_title ||
                    item.reference_data?.title ||
                    item.reference_data?.name ||
                    "Untitled";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md bg-muted/50 p-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{title}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.content_type}
                      </Badge>
                    </div>
                  );
                })}
                {activeWhatsOn.length > 4 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{activeWhatsOn.length - 4} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Restaurants Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Featured Restaurants
              </CardTitle>
              <CardDescription>Highlighted dining options</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/homepage/restaurants">
                Manage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeRestaurants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No featured restaurants</p>
                <Link
                  href="/homepage/restaurants"
                  className="text-sm text-primary hover:underline"
                >
                  Add restaurants →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRestaurants.slice(0, 4).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md bg-muted/50 p-2"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-orange-500/10 text-xs font-medium text-orange-500">
                      {index + 1}
                    </span>
                    {item.featured_image_url || item.tenant?.logo_url ? (
                      <img
                        src={item.featured_image_url || item.tenant?.logo_url || ""}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-sm">
                      {item.tenant?.name || "Unknown"}
                    </span>
                    {item.highlight_text && (
                      <Badge variant="success" className="text-xs">
                        {item.highlight_text}
                      </Badge>
                    )}
                  </div>
                ))}
                {activeRestaurants.length > 4 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{activeRestaurants.length - 4} more restaurants
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Homepage Tips</p>
              <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                <li>• Keep 4-6 items in each section for optimal display</li>
                <li>• Use high-quality images (1200×630px recommended)</li>
                <li>• Update featured content regularly to keep visitors engaged</li>
                <li>• Drag to reorder items - first items appear most prominently</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function HomepageOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewContent />
    </Suspense>
  );
}
