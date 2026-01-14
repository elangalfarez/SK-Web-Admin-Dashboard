import { createClient } from "./server";
import type { PermissionModule, PermissionAction } from "@/types/auth";

/**
 * Server-side permission check utility
 * Verifies if a user has a specific permission before allowing an action
 */
export async function checkUserPermission(
  userId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // First check if user is super admin (bypass all permission checks)
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select(
        `
        role:admin_roles!inner(name)
      `
      )
      .eq("user_id", userId);

    if (
      userRoles?.some(
        (ur: any) => ur.role?.name === "super_admin"
      )
    ) {
      return true; // Super admin has all permissions
    }

    // Check if user has the specific permission
    const { data: permissions, error } = await supabase
      .from("admin_user_roles")
      .select(
        `
        role:admin_roles!inner(
          role_permissions:admin_role_permissions!inner(
            permission:admin_permissions!inner(
              name,
              module,
              action,
              is_active
            )
          )
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Permission check error:", error);
      return false;
    }

    if (!permissions || permissions.length === 0) {
      return false;
    }

    // Flatten and check permissions
    for (const userRole of permissions) {
      const role = userRole.role as any;
      if (!role?.role_permissions) continue;

      for (const rp of role.role_permissions) {
        const permission = rp.permission;
        if (
          permission?.is_active &&
          permission.module === module &&
          permission.action === action
        ) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions (OR logic)
 */
export async function checkUserHasAnyPermission(
  userId: string,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
  for (const { module, action } of permissions) {
    const hasPermission = await checkUserPermission(userId, module, action);
    if (hasPermission) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions (AND logic)
 */
export async function checkUserHasAllPermissions(
  userId: string,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
  for (const { module, action } of permissions) {
    const hasPermission = await checkUserPermission(userId, module, action);
    if (!hasPermission) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user
 * Useful for debugging or displaying user capabilities
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();

    const { data: permissions } = await supabase
      .from("admin_user_roles")
      .select(
        `
        role:admin_roles!inner(
          role_permissions:admin_role_permissions!inner(
            permission:admin_permissions!inner(
              name,
              is_active
            )
          )
        )
      `
      )
      .eq("user_id", userId);

    if (!permissions) return [];

    const permissionNames = new Set<string>();

    for (const userRole of permissions) {
      const role = userRole.role as any;
      if (!role?.role_permissions) continue;

      for (const rp of role.role_permissions) {
        const permission = rp.permission;
        if (permission?.is_active && permission.name) {
          permissionNames.add(permission.name);
        }
      }
    }

    return Array.from(permissionNames);
  } catch (error) {
    console.error("Failed to get user permissions:", error);
    return [];
  }
}
