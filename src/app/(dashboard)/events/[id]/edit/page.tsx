// src/app/(dashboard)/events/[id]/edit/page.tsx
// Created: Edit event page

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { EventForm } from "@/components/events/event-form";
import { getEvent } from "@/actions/events";

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
    title: `Edit: ${result.data.title}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEvent(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Event"
        description={`Editing: ${result.data.title}`}
      />
      <EventForm event={result.data} mode="edit" />
    </div>
  );
}
