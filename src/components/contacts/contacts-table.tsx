// src/components/contacts/contacts-table.tsx
// Created: Contacts data table with bulk actions

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  markContactAsRead,
  markContactAsUnread,
  markMultipleAsRead,
  deleteContact,
  deleteMultipleContacts,
} from "@/actions/contacts";
import { formatRelativeDate } from "@/lib/utils/format-date";
import type { Contact } from "@/types/database";
import { RequirePermission } from "@/components/providers/auth-provider";

// ============================================================================
// TYPES
// ============================================================================

interface ContactsTableProps {
  data: Contact[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================================
// ENQUIRY TYPE COLORS
// ============================================================================

const enquiryTypeColors: Record<string, string> = {
  General: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Leasing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Marketing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Legal: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "Lost & Found": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Parking & Security": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// ============================================================================
// CONTACT ROW
// ============================================================================

interface ContactRowProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}

function ContactRow({ contact, isSelected, onSelect, onDelete }: ContactRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleRead = () => {
    startTransition(async () => {
      const result = contact.is_read
        ? await markContactAsUnread(contact.id)
        : await markContactAsRead(contact.id);

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
        !contact.is_read && "bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
        className="mt-1"
      />

      {/* Unread indicator */}
      <div className="mt-2 shrink-0">
        {!contact.is_read ? (
          <div className="h-2 w-2 rounded-full bg-primary" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-muted" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/contacts/${contact.id}`}
              className={cn(
                "font-medium hover:text-primary hover:underline",
                !contact.is_read && "font-semibold"
              )}
            >
              {contact.full_name}
            </Link>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
          </div>

          {/* Enquiry Type Badge */}
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-xs",
              enquiryTypeColors[contact.enquiry_type]
            )}
          >
            {contact.enquiry_type}
          </Badge>
        </div>

        {/* Message preview */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {contact.enquiry_details}
        </p>

        {/* Meta info */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatRelativeDate(contact.submitted_date)}
          </span>
          {contact.phone_number && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {contact.phone_number}
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
              <Link href={`/contacts/${contact.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <RequirePermission module="contacts" action="edit">
              <DropdownMenuItem onClick={handleToggleRead}>
                {contact.is_read ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Mark as Unread
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-4 w-4" />
                    Mark as Read
                  </>
                )}
              </DropdownMenuItem>
            </RequirePermission>
            <DropdownMenuSeparator />
            <RequirePermission module="contacts" action="delete">
              <DropdownMenuItem
                onClick={() => onDelete(contact.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </RequirePermission>
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
        Showing {start} to {end} of {total} contacts
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

export function ContactsTable({
  data,
  total,
  page,
  perPage,
  totalPages,
}: ContactsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Toggle single selection
  const toggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Toggle all selection
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Handle single delete
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteContact(deleteId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMultipleContacts(Array.from(selectedIds));
      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete contacts");
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  // Handle bulk mark as read
  const handleBulkMarkAsRead = () => {
    startTransition(async () => {
      const result = await markMultipleAsRead(Array.from(selectedIds));
      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No contacts found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact form submissions will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <p className="text-sm font-medium">
              {someSelected
                ? `${selectedIds.size} selected`
                : `${total} contact${total !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Bulk Actions */}
          {someSelected && (
            <div className="flex items-center gap-2">
              <RequirePermission module="contacts" action="edit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  disabled={isPending}
                >
                  <MailOpen className="mr-2 h-4 w-4" />
                  Mark as Read
                </Button>
              </RequirePermission>
              <RequirePermission module="contacts" action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </RequirePermission>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div>
          {data.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              isSelected={selectedIds.has(contact.id)}
              onSelect={toggleSelect}
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

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact submission? This
              action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Contacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} contact
              submission{selectedIds.size !== 1 ? "s" : ""}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
