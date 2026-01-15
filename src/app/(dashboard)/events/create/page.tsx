// src/app/(dashboard)/events/create/page.tsx
// Created: Create new event page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { EventForm } from "@/components/events/event-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Create Event",
};

export default async function CreateEventPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "events",
    "create"
  );

  if (!hasPermission) {
    redirect("/events");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Event"
        description="Add a new event to the mall calendar"
      />
      <EventForm mode="create" />
    </div>
  );
}
