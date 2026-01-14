"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type { PermissionName, UserRoleName } from "@/types/auth";

export async function fetchUserWithPermissions(userId: string) {
  try {
    const supabase = await createAdminClient();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, avatar_url, is_active, created_at, updated_at")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (userError || !userData) {
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

    const roles = (userRoles || [])
      .map((ur: any) => ur.role)
      .filter(Boolean)
      .map((r: any) => ({
        id: r.id,
        name: r.name as UserRoleName,
        display_name: r.display_name,
        description: r.description,
        color: r.color,
      }));

    // Get permissions through roles
    const roleIds = roles.map((r) => r.id);

    let permissionNames: PermissionName[] = [];

    if (roleIds.length > 0) {
      const { data: rolePermissions } = await supabase
        .from("admin_role_permissions")
        .select(`
          permission:admin_permissions (
            name
          )
        `)
        .in("role_id", roleIds);

      permissionNames = (rolePermissions || [])
        .map((rp: any) => rp.permission?.name)
        .filter((name): name is PermissionName => name !== null && name !== undefined);
    }

    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      is_active: userData.is_active,
      roles,
      permissions: new Set(permissionNames),
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
  } catch (error) {
    console.error("Fetch user error:", error);
    return null;
  }
}
