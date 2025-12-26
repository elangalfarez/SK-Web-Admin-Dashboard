// middleware.ts
// Created: Route protection middleware for admin dashboard

import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient, isProtectedRoute, isAuthRoute, isPublicRoute } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // Static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  try {
    const { session, response } = await createMiddlewareClient(request);
    const isAuthenticated = !!session;

    // Public routes - allow access
    if (isPublicRoute(pathname)) {
      return response;
    }

    // Auth routes (login) - redirect to dashboard if already authenticated
    if (isAuthRoute(pathname)) {
      if (isAuthenticated) {
        const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/";
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      return response;
    }

    // Protected routes - redirect to login if not authenticated
    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Default: allow access
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login for protected routes
    if (isProtectedRoute(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
