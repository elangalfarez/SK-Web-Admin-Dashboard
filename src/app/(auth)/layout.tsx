// src/app/(auth)/layout.tsx
// Created: Auth layout with centered design (no sidebar)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Supermal Karawaci Admin Dashboard",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-tr from-primary/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Supermal Karawaci. All rights reserved.</p>
      </footer>
    </div>
  );
}
