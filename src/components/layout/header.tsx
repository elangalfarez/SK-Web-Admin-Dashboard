// src/components/layout/header.tsx
// Created: Dashboard header with breadcrumbs and user actions

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// BREADCRUMB GENERATION
// ============================================================================

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  events: "Events",
  promotions: "Promotions",
  blog: "Blog",
  "whats-on": "What's On",
  "featured-restaurants": "Featured Restaurants",
  tenants: "Tenants",
  "site-settings": "Site Settings",
  contacts: "Contacts",
  "admin-users": "Admin Users",
  "vip-cards": "VIP Cards",
  "audit-logs": "Audit Logs",
  profile: "Profile",
  create: "Create",
  edit: "Edit",
  categories: "Categories",
  roles: "Roles",
  tiers: "Tiers",
  benefits: "Benefits",
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/" },
  ];

  let currentPath = "";
  
  for (const segment of segments) {
    currentPath += `/${segment}`;
    
    // Skip UUID segments (they're typically resource IDs)
    if (/^[a-f0-9-]{36}$/i.test(segment)) {
      continue;
    }
    
    // Skip numeric IDs
    if (/^\d+$/.test(segment)) {
      continue;
    }

    const label = routeLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6",
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Breadcrumbs */}
      <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Breadcrumb">
        {breadcrumbs.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile title */}
      <h1 className="text-lg font-semibold lg:hidden">
        {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="gap-2 border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="hidden sm:inline">Status:</span> Active
        </Badge>

        {/* Developer Credits */}
        <div className="hidden items-center gap-2 border-l border-border pl-3 text-xs text-muted-foreground lg:flex">
          <span className="font-medium">Developed by:</span>
          <Link
            href="https://algan.id"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:text-primary"
          >
            Elang Alfarez | Algan Studio
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// PAGE HEADER COMPONENT
// ============================================================================

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
