// src/app/(dashboard)/settings/layout.tsx
// Created: Settings section layout with navigation

import { PageHeader } from "@/components/layout/header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card } from "@/components/ui/card";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage site configuration and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navigation Sidebar */}
        <Card className="h-fit p-4 lg:sticky lg:top-20">
          <SettingsNav />
        </Card>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
