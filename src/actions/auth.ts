// src/actions/auth.ts
// Created: Server actions for authentication

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import type { ActionResult } from "@/lib/utils/api-helpers";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

// ============================================================================
// LOGIN WITH EMAIL/PASSWORD
// ============================================================================

export async function loginWithPassword(
  email: string,
  password: string
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const supabase = await createAdminClient();
    
    // Find admin user by email
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, password_hash, full_name, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userError || !adminUser) {
      return errorResponse("Invalid email or password");
    }

    if (!adminUser.is_active) {
      return errorResponse("Your account has been deactivated. Please contact an administrator.");
    }

    // Verify password
    // Note: In production, use bcrypt.compare()
    // For development, we're using a simple check
    const isValidPassword = await verifyPassword(password, adminUser.password_hash);
    
    if (!isValidPassword) {
      return errorResponse("Invalid email or password");
    }

    // Create a session using Supabase Auth
    // We sign in with the admin user's email to create a session
    // Note: signInWithPassword may fail if user doesn't exist in auth.users,
    // but we can still authenticate via admin_users table below
    await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    }).catch(() => { /* Ignore error - we handle auth via admin_users table */ });

    // If Supabase Auth fails (user might not exist in auth.users),
    // we can still authenticate via admin_users table
    // For now, we'll set a custom session cookie
    
    // Set session cookie with admin user ID
    const cookieStore = await cookies();
    const sessionData = {
      userId: adminUser.id,
      email: adminUser.email,
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

    // Log the login activity
    await logActivity(adminUser.id, "login", "auth", {
      resourceType: "admin_user",
      resourceId: adminUser.id,
      resourceName: adminUser.full_name,
    });

    return successResponse({ redirectTo: "/" }, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("An error occurred during login. Please try again.");
  }
}

// ============================================================================
// LOGIN WITH MAGIC LINK
// ============================================================================

export async function loginWithMagicLink(
  email: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createAdminClient();
    
    // First check if the email exists in admin_users
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userError || !adminUser) {
      return errorResponse("No admin account found with this email");
    }

    if (!adminUser.is_active) {
      return errorResponse("Your account has been deactivated. Please contact an administrator.");
    }

    // Send magic link via Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (otpError) {
      console.error("Magic link error:", otpError);
      return errorResponse("Failed to send magic link. Please try again.");
    }

    return successResponse(undefined, "Magic link sent! Check your email.");
  } catch (error) {
    console.error("Magic link error:", error);
    return errorResponse("An error occurred. Please try again.");
  }
}

// ============================================================================
// LOGOUT
// ============================================================================

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    
    // Clear custom session cookie
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  // Always redirect to login
  redirect("/login");
}

// ============================================================================
// GET CURRENT SESSION
// ============================================================================

export async function getCurrentSession(): Promise<{
  userId: string;
  email: string;
  fullName: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");
    
    if (!sessionCookie?.value) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      cookieStore.delete("admin_session");
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function requestPasswordReset(
  email: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createAdminClient();
    
    // Check if email exists in admin_users
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!adminUser || !adminUser.is_active) {
      // Don't reveal if email exists or not for security
      return successResponse(undefined, "If an account exists with this email, you will receive a password reset link.");
    }

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
    }

    return successResponse(undefined, "If an account exists with this email, you will receive a password reset link.");
  } catch (error) {
    console.error("Password reset error:", error);
    return errorResponse("An error occurred. Please try again.");
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify password against hash
 * In production, use bcrypt.compare()
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For development: simple comparison
  // In production: return await bcrypt.compare(password, hash);
  
  // Check if it's a base64 encoded password (simple dev hash)
  const simpleHash = Buffer.from(password).toString("base64");
  if (hash === simpleHash) {
    return true;
  }
  
  // Also check plain text for development (NOT SECURE - remove in production)
  if (hash === password) {
    return true;
  }
  
  return false;
}

/**
 * Hash a password
 * In production, use bcrypt.hash()
 */
export async function hashPassword(password: string): Promise<string> {
  // For development: simple base64 encoding
  // In production: return await bcrypt.hash(password, 12);
  return Buffer.from(password).toString("base64");
}
