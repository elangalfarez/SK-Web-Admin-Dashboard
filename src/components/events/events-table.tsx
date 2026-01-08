// src/components/events/events-table.tsx
// Created: Events data table with actions

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Star,
  StarOff,
  Globe,
  GlobeLock,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDisplayDate, getDateStatus } from "@/lib/utils/format-date";
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
import { deleteEvent, toggleEventPublish, toggleEventFeatured } from "@/actions/events";
import type { Event } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface EventsTableProps {
  data: Event[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================================
// EVENT ROW
// ============================================================================

interface EventRowProps {
  event: Event;
  onDelete: (id: string) => void;
}

function EventRow({ event, onDelete }: EventRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dateStatus = getDateStatus(event.start_at, event.end_at || undefined);

  // Extract cover image URL (handle both string and object formats)
  const coverImage = event.images?.[0]
    ? typeof event.images[0] === 'string'
      ? event.images[0]
      : event.images[0]?.url
    : undefined;

  const handleTogglePublish = () => {
    startTransition(async () => {
      const result = await toggleEventPublish(event.id, !event.is_published);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      const result = await toggleEventFeatured(event.id, !event.is_featured);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 border-b border-border p-4 last:border-0 transition-colors hover:bg-muted/50",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Cover Image */}
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {event.is_featured && (
          <div className="absolute left-1 top-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/events/${event.id}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {event.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDisplayDate(event.start_at)}
                {event.end_at && ` - ${formatDisplayDate(event.end_at)}`}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue}
                </span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={event.is_published ? "published" : "draft"}>
              {event.is_published ? "Published" : "Draft"}
            </Badge>
            <Badge variant={dateStatus}>
              {dateStatus.charAt(0).toUpperCase() + dateStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/events/${event.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePublish}>
              {event.is_published ? (
                <>
                  <GlobeLock className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleFeatured}>
              {event.is_featured ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  Remove Featured
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Mark Featured
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(event.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}

function Pagination({ page, totalPages, total, perPage }: PaginationProps) {
  const router = useRouter();
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start} to {end} of {total} events
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EventsTable({ data, total, page, perPage, totalPages }: EventsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteEvent(deleteId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No events found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first event.
        </p>
        <Button asChild className="mt-4">
          <Link href="/events/create">Create Event</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        {/* Table Header */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">
            {total} event{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table Body */}
        <div>
          {data.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
