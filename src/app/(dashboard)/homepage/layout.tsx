// src/app/(dashboard)/homepage/layout.tsx
// Created: Homepage content management section layout

import { PageHeader } from "@/components/layout/header";
import { HomepageNav } from "@/components/homepage/homepage-nav";

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage"
        description="Manage featured content on the public homepage"
      />

      {/* Navigation Tabs */}
      <HomepageNav />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
