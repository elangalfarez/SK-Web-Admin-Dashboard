// src/app/(dashboard)/contacts/[id]/contact-actions.tsx
// Created: Contact detail page actions component

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  deleteContact,
} from "@/actions/contacts";
import type { Contact } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface ContactActionsProps {
  contact: Contact;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactActions({ contact }: ContactActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteContact(contact.id);
      if (result.success) {
        toast.success(result.message);
        router.push("/contacts");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleToggleRead}
          disabled={isPending}
        >
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
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact submission from{" "}
              <strong>{contact.full_name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
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
