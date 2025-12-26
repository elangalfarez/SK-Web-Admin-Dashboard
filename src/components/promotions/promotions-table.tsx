// src/components/promotions/promotions-table.tsx
// Created: Promotions data table with actions

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Store,
  Calendar,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  XCircle,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDisplayDate, getPromotionDateStatus } from "@/lib/utils/format-date";
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
import { deletePromotion, updatePromotionStatus } from "@/actions/promotions";
import type { PromotionWithTenant, PromotionStatus } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface PromotionsTableProps {
  data: PromotionWithTenant[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: PromotionStatus }) {
  const variants: Record<PromotionStatus, { variant: "published" | "draft" | "inactive"; label: string }> = {
    published: { variant: "published", label: "Published" },
    staging: { variant: "draft", label: "Staging" },
    expired: { variant: "inactive", label: "Expired" },
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}

// ============================================================================
// PROMOTION ROW
// ============================================================================

interface PromotionRowProps {
  promotion: PromotionWithTenant;
  onDelete: (id: string) => void;
}

function PromotionRow({ promotion, onDelete }: PromotionRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dateStatus = getPromotionDateStatus(
    promotion.start_date || undefined,
    promotion.end_date || undefined
  );

  const handleStatusChange = (status: PromotionStatus) => {
    startTransition(async () => {
      const result = await updatePromotionStatus(promotion.id, status);
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
      {/* Promotion Image */}
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        {promotion.image_url ? (
          <img
            src={promotion.image_url}
            alt={promotion.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/promotions/${promotion.id}`}
              className="font-medium hover:text-primary hover:underline line-clamp-1"
            >
              {promotion.title}
            </Link>
            
            {/* Tenant info */}
            {promotion.tenant && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-3.5 w-3.5" />
                <span>{promotion.tenant.name}</span>
                {promotion.tenant.tenant_code && (
                  <span className="text-xs opacity-75">
                    ({promotion.tenant.tenant_code})
                  </span>
                )}
              </div>
            )}

            {/* Date range */}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {(promotion.start_date || promotion.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {promotion.start_date && formatDisplayDate(promotion.start_date)}
                  {promotion.start_date && promotion.end_date && " - "}
                  {promotion.end_date && formatDisplayDate(promotion.end_date)}
                </span>
              )}
              {promotion.source_post && (
                <a
                  href={promotion.source_post}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={promotion.status} />
            {dateStatus !== "active" && promotion.status === "published" && (
              <Badge variant={dateStatus === "upcoming" ? "upcoming" : "ended"}>
                {dateStatus === "upcoming" ? "Upcoming" : "Ended"}
              </Badge>
            )}
          </div>
        </div>
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
              <Link href={`/promotions/${promotion.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/promotions/${promotion.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Status actions */}
            {promotion.status !== "published" && (
              <DropdownMenuItem onClick={() => handleStatusChange("published")}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            )}
            {promotion.status === "published" && (
              <DropdownMenuItem onClick={() => handleStatusChange("staging")}>
                <PauseCircle className="mr-2 h-4 w-4" />
                Move to Staging
              </DropdownMenuItem>
            )}
            {promotion.status !== "expired" && (
              <DropdownMenuItem onClick={() => handleStatusChange("expired")}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Expired
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(promotion.id)}
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
        Showing {start} to {end} of {total} promotions
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

export function PromotionsTable({ data, total, page, perPage, totalPages }: PromotionsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deletePromotion(deleteId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete promotion");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No promotions found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first promotion.
        </p>
        <Button asChild className="mt-4">
          <Link href="/promotions/create">Create Promotion</Link>
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
            {total} promotion{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table Body */}
        <div>
          {data.map((promotion) => (
            <PromotionRow
              key={promotion.id}
              promotion={promotion}
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
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotion? This action cannot be undone.
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
