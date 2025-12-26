// src/app/(dashboard)/page.tsx
// Created: Dashboard overview page with metrics and analytics

import { Suspense } from "react";
import Link from "next/link";
import {
  Calendar,
  Tag,
  FileText,
  Store,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/header";
import {
  DashboardStats,
  RecentActivityWidget,
  ContentOverviewWidget,
  ActivityChart,
  ModuleChart,
} from "@/components/activity";
import {
  getDashboardStats,
  getRecentActivity,
  getContentOverview,
  getActivityByDay,
  getActivityByModule,
} from "@/actions/analytics";

// ============================================================================
// QUICK ACTIONS
// ============================================================================

function QuickActions() {
  const actions = [
    { label: "Create Event", href: "/events/create", icon: Calendar },
    { label: "Add Promotion", href: "/promotions/create", icon: Tag },
    { label: "Write Blog Post", href: "/blog/create", icon: FileText },
    { label: "Add Tenant", href: "/tenants/create", icon: Store },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              className="h-auto justify-start gap-3 p-4"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5 text-primary" />
                <span>{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ASYNC DATA COMPONENTS
// ============================================================================

async function StatsSection() {
  const result = await getDashboardStats();
  
  if (!result.success) {
    return null;
  }

  return <DashboardStats stats={result.data} />;
}

async function RecentActivitySection() {
  const result = await getRecentActivity(8);
  
  if (!result.success) {
    return null;
  }

  return <RecentActivityWidget activities={result.data} />;
}

async function ContentOverviewSection() {
  const result = await getContentOverview();
  
  if (!result.success) {
    return null;
  }

  return <ContentOverviewWidget overview={result.data} />;
}

async function ActivityChartSection() {
  const result = await getActivityByDay(14);
  
  if (!result.success) {
    return null;
  }

  return <ActivityChart data={result.data} />;
}

async function ModuleChartSection() {
  const result = await getActivityByModule();
  
  if (!result.success) {
    return null;
  }

  return <ModuleChart data={result.data} />;
}

async function UnreadContactsAlert() {
  const result = await getDashboardStats();
  
  if (!result.success || result.data.unreadContacts === 0) {
    return null;
  }

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning">
          <Mail className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">
            You have {result.data.unreadContacts} unread contact{result.data.unreadContacts !== 1 ? "s" : ""}
          </p>
          <p className="text-sm text-muted-foreground">Review and respond to inquiries</p>
        </div>
        <Button asChild>
          <Link href="/contacts">View Contacts</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your content."
      />

      {/* Stats Grid */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<WidgetSkeleton />}>
          <ActivityChartSection />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <ModuleChartSection />
        </Suspense>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <ContentOverviewSection />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<WidgetSkeleton />}>
            <RecentActivitySection />
          </Suspense>
        </div>
      </div>

      {/* Unread Contacts Alert */}
      <Suspense fallback={null}>
        <UnreadContactsAlert />
      </Suspense>
    </div>
  );
}
