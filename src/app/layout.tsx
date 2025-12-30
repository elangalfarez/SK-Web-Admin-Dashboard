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
        {/* Inline styles for initial loading state (shows before JS loads) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #initial-loader {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-color, #fafafa);
                z-index: 9999;
                transition: opacity 0.3s ease-out;
              }
              .dark #initial-loader { --bg-color: #0f1117; }
              #initial-loader.hidden { opacity: 0; pointer-events: none; }
              #initial-loader .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e5e7eb;
                border-top-color: #6366f1;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              .dark #initial-loader .spinner {
                border-color: #374151;
                border-top-color: #818cf8;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            `,
          }}
        />
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
        {/* Initial loader - hidden once React hydrates */}
        <div id="initial-loader">
          <div className="spinner" />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Hide loader when page is interactive
              if (document.readyState === 'complete') {
                document.getElementById('initial-loader')?.classList.add('hidden');
              } else {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    document.getElementById('initial-loader')?.classList.add('hidden');
                  }, 100);
                });
              }
            `,
          }}
        />
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
