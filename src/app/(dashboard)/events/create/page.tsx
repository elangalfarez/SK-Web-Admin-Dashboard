// src/app/(dashboard)/events/create/page.tsx
// Created: Create new event page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = {
  title: "Create Event",
};

export default function CreateEventPage() {
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
