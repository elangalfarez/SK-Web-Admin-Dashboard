// src/lib/supabase/middleware.ts
// Created: Supabase middleware utilities for route protection

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Create Supabase client for middleware
 * Handles session refresh and cookie updates
 */
export async function createMiddlewareClient(request: NextRequest) {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT use getUser() here as it makes a network request
  // Use getSession() instead which reads from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { supabase, session, response: supabaseResponse };
}

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  // Dashboard routes are protected
  const protectedPrefixes = [
    "/events",
    "/promotions",
    "/blog",
    "/whats-on",
    "/featured-restaurants",
    "/tenants",
    "/site-settings",
    "/contacts",
    "/admin-users",
    "/vip-cards",
    "/audit-logs",
    "/profile",
  ];

  // Root path (dashboard) is also protected
  if (pathname === "/") {
    return true;
  }

  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if a path is an auth route (login, etc.)
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ["/login"];
  return authRoutes.includes(pathname);
}

/**
 * Check if a path is a public route (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    "/api/auth/callback",
    "/_next",
    "/favicon.ico",
    "/images",
  ];
  
  return publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route
  );
}

/**
 * Get redirect URL based on auth state and requested path
 */
export function getRedirectUrl(
  request: NextRequest,
  isAuthenticated: boolean
): string | null {
  const pathname = request.nextUrl.pathname;

  // Skip redirect for public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Authenticated user trying to access auth routes → redirect to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    return "/";
  }

  // Unauthenticated user trying to access protected routes → redirect to login
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return loginUrl.toString();
  }

  return null;
}
