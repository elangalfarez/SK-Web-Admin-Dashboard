// src/app/(dashboard)/users/layout.tsx
// Created: Users management section layout

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/header";

const navItems = [
  { href: "/users", label: "Users", exact: true },
  { href: "/users/roles", label: "Roles & Permissions", exact: false },
];

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage admin users, roles, and permissions"
      />

      {/* Navigation Tabs */}
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

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
