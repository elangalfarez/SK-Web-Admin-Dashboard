// src/components/tenants/tenants-table.tsx
// Created: Tenants data table with actions

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
  Building2,
  Phone,
  Star,
  StarOff,
  Power,
  PowerOff,
  Sparkles,
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
import { deleteTenant, toggleTenantStatus, toggleTenantFeatured } from "@/actions/tenants";
import type { TenantWithCategory } from "@/actions/tenants";

// ============================================================================
// TYPES
// ============================================================================

interface TenantsTableProps {
  data: TenantWithCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================================
// TENANT ROW
// ============================================================================

interface TenantRowProps {
  tenant: TenantWithCategory;
  onDelete: (id: string) => void;
}

function TenantRow({ tenant, onDelete }: TenantRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleTenantStatus(tenant.id, !tenant.is_active);
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
      const result = await toggleTenantFeatured(tenant.id, !tenant.is_featured);
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
        isPending && "opacity-50 pointer-events-none",
        !tenant.is_active && "opacity-60"
      )}
    >
      {/* Logo */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {tenant.logo_url ? (
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Store className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {tenant.is_featured && (
          <div className="absolute -right-1 -top-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/tenants/${tenant.id}`}
                className="font-medium hover:text-primary hover:underline"
              >
                {tenant.name}
              </Link>
              {tenant.is_new_tenant && (
                <Badge variant="info" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tenant.tenant_code}
            </p>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={tenant.is_active ? "success" : "inactive"}>
              {tenant.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {tenant.category && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tenant.category.color }}
              />
              {tenant.category.display_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {tenant.main_floor}
          </span>
          {tenant.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {tenant.phone}
            </span>
          )}
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
              <Link href={`/tenants/${tenant.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tenants/${tenant.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleStatus}>
              {tenant.is_active ? (
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
            <DropdownMenuItem onClick={handleToggleFeatured}>
              {tenant.is_featured ? (
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
              onClick={() => onDelete(tenant.id)}
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
        Showing {start} to {end} of {total} tenants
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

export function TenantsTable({ data, total, page, perPage, totalPages }: TenantsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteTenant(deleteId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete tenant");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No tenants found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by adding your first tenant.
        </p>
        <Button asChild className="mt-4">
          <Link href="/tenants/create">Add Tenant</Link>
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
            {total} tenant{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table Body */}
        <div>
          {data.map((tenant) => (
            <TenantRow
              key={tenant.id}
              tenant={tenant}
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
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
              Any linked promotions must be deleted first.
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
