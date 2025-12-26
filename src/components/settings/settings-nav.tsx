// src/components/settings/settings-nav.tsx
// Created: Settings navigation component

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  MapPin,
  Share2,
  Search,
  BarChart3,
  Code,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems = [
  {
    title: "General",
    href: "/settings",
    icon: Building2,
    description: "Site identity & branding",
  },
  {
    title: "Contact",
    href: "/settings/contact",
    icon: MapPin,
    description: "Address & contact info",
  },
  {
    title: "Social",
    href: "/settings/social",
    icon: Share2,
    description: "Social media links",
  },
  {
    title: "SEO",
    href: "/settings/seo",
    icon: Search,
    description: "Search optimization",
  },
  {
    title: "Analytics",
    href: "/settings/analytics",
    icon: BarChart3,
    description: "Tracking & pixels",
  },
  {
    title: "Scripts",
    href: "/settings/scripts",
    icon: Code,
    description: "Custom code injection",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs opacity-70 truncate">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
