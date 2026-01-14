// src/app/(dashboard)/layout.tsx
// Created: Dashboard layout with sidebar navigation and header

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const loginUrl = `/login${currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`;
      window.location.href = loginUrl;
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        className={cn(
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          "lg:pl-64"
        )}
      >
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-4 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:w-full">
              <p>© {new Date().getFullYear()} Supermal Karawaci. All rights reserved.</p>
              <p>Admin Dashboard v1.0.0</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Developed by:</span>
              <a
                href="https://algan.id"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition-colors hover:text-primary"
              >
                Elang Alfarez | Algan Studio
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
