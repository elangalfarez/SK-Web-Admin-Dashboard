// src/lib/supabase/auth.ts
// Created: Authentication helper functions for admin dashboard

import { createClient, createAdminClient } from "./server";
import type {
  AuthUser,
  AuthResponse,
  LoginCredentials,
  MagicLinkRequest,
  UserRoleName,
  PermissionModule,
  PermissionAction,
  PermissionName,
  UserRole,
} from "@/types/auth";
import type { AdminUser } from "@/types/database";

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Sign in with email and password
 * Uses custom admin_users table (not Supabase Auth)
 */
export async function signInWithPassword(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    const supabase = await createAdminClient();
    
    // Query admin_users table directly
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", credentials.email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (userError || !adminUser) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Verify password using bcrypt comparison
    // Note: In production, use a proper password hashing library
    // For now, we'll do a simple check (you should implement proper bcrypt verification)
    const isValidPassword = await verifyPassword(
      credentials.password,
      adminUser.password_hash
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Get user with roles and permissions
    const authUser = await getAuthUserById(adminUser.id);

    if (!authUser) {
      return {
        success: false,
        error: "Failed to load user data",
      };
    }

    return {
      success: true,
      user: authUser,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: "An error occurred during sign in",
    };
  }
}

/**
 * Sign in with magic link (email-based passwordless login)
 * Note: This uses Supabase Auth for the magic link functionality
 */
export async function signInWithMagicLink(
  request: MagicLinkRequest
): Promise<AuthResponse> {
  try {
    const supabase = await createClient();
    
    // First verify the email exists in admin_users
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("email", request.email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (!adminUser) {
      return {
        success: false,
        error: "No active admin account found with this email",
      };
    }

    // Send magic link via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email: request.email,
      options: {
        emailRedirectTo: request.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Magic link sent! Check your email.",
    };
  } catch (error) {
    console.error("Magic link error:", error);
    return {
      success: false,
      error: "Failed to send magic link",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return null;
    }

    // Get admin user by email
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", session.user.email)
      .eq("is_active", true)
      .single();

    if (!adminUser) {
      return null;
    }

    return getAuthUserById(adminUser.id);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Get admin user by ID with roles and permissions
 */
export async function getAuthUserById(userId: string): Promise<AuthUser | null> {
  try {
    const supabase = await createAdminClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, avatar_url, is_active, created_at, updated_at")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return null;
    }

    // Get user roles
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select(`
        role:admin_roles (
          id,
          name,
          display_name,
          description,
          color
        )
      `)
      .eq("user_id", userId);

    const roles: UserRole[] = (userRoles || [])
      .map((ur) => {
        // Handle Supabase join - role may be an object or array
        const role = ur.role;
        if (Array.isArray(role)) {
          return role[0] || null;
        }
        return role;
      })
      .filter((r): r is { id: string; name: string; display_name: string; description: string | null; color: string | null } => r !== null && typeof r === 'object' && 'id' in r)
      .map((r) => ({
        id: r.id,
        name: r.name as UserRoleName,
        display_name: r.display_name,
        description: r.description,
        color: r.color,
      }));

    // Get permissions through roles
    const roleIds = roles.map((r) => r.id);
    
    const { data: rolePermissions } = await supabase
      .from("admin_role_permissions")
      .select(`
        permission:admin_permissions (
          name
        )
      `)
      .in("role_id", roleIds);

    const permissionNames = new Set<PermissionName>(
      (rolePermissions || [])
        .map((rp) => {
          // Handle Supabase join - permission may be an object or array
          const permission = rp.permission;
          if (Array.isArray(permission)) {
            const perm = permission[0] as { name: string } | null;
            return perm?.name;
          }
          const perm = permission as { name: string } | null;
          return perm?.name;
        })
        .filter((name): name is PermissionName => name !== null && name !== undefined)
    );

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      roles,
      permissions: permissionNames,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error("Get auth user error:", error);
    return null;
  }
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: AuthUser | null,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.roles.some((r) => r.name === "super_admin")) {
    return true;
  }

  const permissionName: PermissionName = `${module}.${action}`;
  return user.permissions.has(permissionName);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthUser | null,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): boolean {
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.roles.some((r) => r.name === "super_admin")) {
    return true;
  }

  return permissions.some(({ module, action }) => 
    hasPermission(user, module, action)
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthUser | null,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): boolean {
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.roles.some((r) => r.name === "super_admin")) {
    return true;
  }

  return permissions.every(({ module, action }) => 
    hasPermission(user, module, action)
  );
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, roleName: UserRoleName): boolean {
  if (!user) return false;
  return user.roles.some((r) => r.name === roleName);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "super_admin");
}

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

/**
 * Get admin user by email
 */
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get admin user by email error:", error);
    return null;
  }
}

/**
 * Update admin user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    
    await supabase
      .from("admin_users")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId);
  } catch (error) {
    console.error("Update last login error:", error);
  }
}

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Verify password against hash
 * Note: In production, use bcrypt.compare()
 * This is a placeholder that should be replaced with proper implementation
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // TODO: Implement proper bcrypt comparison
  // For now, using simple comparison for development
  // In production: return await bcrypt.compare(password, hash);
  
  // Simple hash check (NOT SECURE - replace with bcrypt)
  const simpleHash = Buffer.from(password).toString("base64");
  return hash === simpleHash || hash === password;
}

/**
 * Hash a password
 * Note: In production, use bcrypt.hash()
 */
export async function hashPassword(password: string): Promise<string> {
  // TODO: Implement proper bcrypt hashing
  // In production: return await bcrypt.hash(password, 12);
  
  // Simple hash (NOT SECURE - replace with bcrypt)
  return Buffer.from(password).toString("base64");
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log admin activity
 */
export async function logActivity(
  userId: string | null,
  action: string,
  module: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const supabase = await createAdminClient();
    
    await supabase.from("admin_activity_logs").insert({
      user_id: userId,
      action,
      module,
      resource_type: options?.resourceType,
      resource_id: options?.resourceId,
      resource_name: options?.resourceName,
      old_values: options?.oldValues,
      new_values: options?.newValues,
      metadata: options?.metadata || {},
    });
  } catch (error) {
    console.error("Log activity error:", error);
  }
}
