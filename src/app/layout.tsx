// src/app/layout.tsx
// Created: Root layout with fonts, theme provider, and global providers

import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// Inter for UI/body text - clean and readable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Playfair Display for headings - elegant and premium
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Supermal Karawaci",
    template: "%s | Supermal Karawaci Admin",
  },
  description: "Admin dashboard for managing Supermal Karawaci content, events, tenants, and more.",
  robots: {
    index: false, // Admin dashboard should not be indexed
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent FOUC by setting initial theme before render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('supermal-admin-theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "font-sans",
              title: "font-medium",
              description: "text-sm text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
