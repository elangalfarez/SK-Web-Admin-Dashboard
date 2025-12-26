// src/components/homepage/homepage-nav.tsx
// Created: Homepage section navigation with active state

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/homepage", label: "Overview", exact: true },
  { href: "/homepage/whats-on", label: "What's On", exact: false },
  { href: "/homepage/restaurants", label: "Featured Restaurants", exact: false },
];

export function HomepageNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
