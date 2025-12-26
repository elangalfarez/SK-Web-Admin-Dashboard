// src/app/(dashboard)/contacts/[id]/page.tsx
// Created: Contact detail/view page

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Phone,
  Calendar,
  MessageSquare,
  User,
  Clock,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact, markContactAsRead } from "@/actions/contacts";
import { formatRelativeDate, formatDate } from "@/lib/utils/format-date";
import { ContactActions } from "./contact-actions";

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
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getContact(id);

  if (!result.success || !result.data) {
    return { title: "Contact Not Found" };
  }

  return {
    title: `Contact from ${result.data.full_name}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getContact(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const contact = result.data;

  // Auto-mark as read when viewed
  if (!contact.is_read) {
    await markContactAsRead(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold">
                {contact.full_name}
              </h1>
              {!contact.is_read && (
                <Badge variant="info">
                  <Mail className="mr-1 h-3 w-3" />
                  Unread
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{contact.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={enquiryTypeColors[contact.enquiry_type]}
              >
                {contact.enquiry_type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatRelativeDate(contact.submitted_date)}
              </span>
            </div>
          </div>
        </div>
        <ContactActions contact={contact} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-foreground">
                {contact.enquiry_details}
              </div>
            </CardContent>
          </Card>

          {/* Admin Response (if exists) */}
          {contact.admin_response && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailOpen className="h-4 w-4 text-primary" />
                  Admin Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap text-foreground">
                  {contact.admin_response.response_message}
                </div>
                <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                  <p>
                    Responded by{" "}
                    <span className="font-medium">
                      {contact.admin_response.admin_name || "Admin"}
                    </span>
                  </p>
                  <p>
                    {formatDate(contact.admin_response.responded_at, {
                      includeTime: true,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium hover:text-primary hover:underline break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              {contact.phone_number && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${contact.phone_number}`}
                      className="text-sm font-medium hover:text-primary hover:underline"
                    >
                      {contact.phone_number}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`mailto:${contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                  <ExternalLink className="ml-auto h-3 w-3" />
                </a>
              </Button>
              {contact.phone_number && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={`tel:${contact.phone_number}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                </Button>
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
                <span className="text-muted-foreground">Submitted</span>
                <span>
                  {formatDate(contact.submitted_date, { includeTime: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enquiry Type</span>
                <span>{contact.enquiry_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{contact.is_read ? "Read" : "Unread"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs truncate max-w-[120px]">
                  {contact.id.slice(0, 8)}...
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
