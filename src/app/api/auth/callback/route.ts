// src/app/api/auth/callback/route.ts
// Created: OAuth/Magic Link callback handler

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Verify user exists in admin_users table
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id, full_name, is_active")
        .eq("email", data.session.user.email)
        .single();

      if (adminUser && adminUser.is_active) {
        // Set custom session cookie
        const sessionData = {
          userId: adminUser.id,
          email: data.session.user.email,
          fullName: adminUser.full_name,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        cookieStore.set("admin_session", JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: "/",
        });

        return NextResponse.redirect(`${origin}${next}`);
      } else {
        // User not found in admin_users or inactive
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized&message=No active admin account found`
        );
      }
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
