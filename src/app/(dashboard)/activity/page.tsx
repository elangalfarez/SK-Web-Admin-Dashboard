// src/app/(dashboard)/activity/page.tsx
// Created: Activity logs page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { ActivityTable } from "@/components/activity";

export const metadata: Metadata = {
  title: "Activity Logs",
};

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all admin actions and system events"
      />
      <ActivityTable />
    </div>
  );
}
