// src/app/(dashboard)/events/[id]/page.tsx
// Created: Event detail/view page

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Calendar,
  MapPin,
  Clock,
  Pencil,
  ArrowLeft,
  Globe,
  GlobeLock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent } from "@/actions/events";
import { formatDisplayDateTime, getDateStatus } from "@/lib/utils/format-date";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getEvent(id);

  if (!result.success || !result.data) {
    return { title: "Event Not Found" };
  }

  return {
    title: result.data.title,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEvent(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const event = result.data;
  const dateStatus = getDateStatus(event.start_at, event.end_at || undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold">{event.title}</h1>
              {event.is_featured && (
                <Star className="h-5 w-5 fill-primary text-primary" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={event.is_published ? "published" : "draft"}>
                {event.is_published ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    Published
                  </>
                ) : (
                  <>
                    <GlobeLock className="mr-1 h-3 w-3" />
                    Draft
                  </>
                )}
              </Badge>
              <Badge variant={dateStatus}>
                {dateStatus.charAt(0).toUpperCase() + dateStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/events/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Event
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cover Image */}
          {event.images && event.images.length > 0 && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <img
                src={typeof event.images[0] === 'string' ? event.images[0] : event.images[0]?.url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Additional Images */}
          {event.images && event.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {event.images.slice(1).map((image, index) => (
                <div
                  key={index}
                  className="aspect-video overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={typeof image === 'string' ? image : image?.url}
                    alt={`${event.title} ${index + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {event.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{event.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {event.body && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.body }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Start</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDisplayDateTime(event.start_at)}
                  </p>
                </div>
              </div>
              {event.end_at && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">End</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDateTime(event.end_at)}
                    </p>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
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
                <span>{new Date(event.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(event.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {event.slug}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
