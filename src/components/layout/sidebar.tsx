// src/components/layout/sidebar.tsx
// Created: Dashboard sidebar with navigation and user menu

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Tag,
  FileText,
  Sparkles,
  Utensils,
  Store,
  Settings,
  Mail,
  Users,
  CreditCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Events", href: "/events", icon: Calendar },
      { title: "Promotions", href: "/promotions", icon: Tag },
      { title: "Blog", href: "/blog", icon: FileText },
    ],
  },
  {
    title: "Homepage",
    items: [
      { title: "What's On", href: "/homepage/whats-on", icon: Sparkles },
      { title: "Featured Restaurants", href: "/homepage/restaurants", icon: Utensils },
    ],
  },
  {
    title: "Directory",
    items: [
      { title: "Tenants", href: "/tenants", icon: Store },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Site Settings", href: "/settings", icon: Settings },
      { title: "Contacts", href: "/contacts", icon: Mail },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Admin Users", href: "/users", icon: Users },
      { title: "VIP Cards", href: "/vip", icon: CreditCard },
      { title: "Activity Logs", href: "/activity", icon: Activity },
    ],
  },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Check if route is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Cycle through themes
  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-sidebar-foreground">
                Supermal
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "sidebar-nav-item",
                        isActive(item.href) && "active",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className={cn(
              "sidebar-nav-item mb-2 w-full",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? `Theme: ${theme}` : undefined}
          >
            <ThemeIcon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="capitalize">{theme} Mode</span>
            )}
          </button>

          {/* User menu */}
          {user && (
            <Link
              href="/settings/profile"
              className={cn(
                "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? `${user.full_name} - Settings` : undefined}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {user.full_name}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    {user.roles[0]?.display_name || "Admin"}
                  </p>
                </div>
              )}
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "sidebar-nav-item mt-2 w-full text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button - rendered in Header */}
    </>
  );
}

// ============================================================================
// MOBILE MENU BUTTON
// ============================================================================

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </Button>
  );
}
