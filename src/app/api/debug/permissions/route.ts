import { NextResponse } from "next/server";
import { getCurrentSession } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Get user's roles
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select(`
        role:admin_roles (
          id,
          name,
          display_name
        )
      `)
      .eq("user_id", session.userId);

    const roles = (userRoles || [])
      .map((ur: any) => ur.role)
      .filter(Boolean);

    // Get user's permissions
    const roleIds = roles.map((r: any) => r.id);

    let permissions: any[] = [];
    let rawRolePermissions: any[] = [];

    if (roleIds.length > 0) {
      // Try the join query
      const { data: rolePermissions, error: rpError } = await supabase
        .from("admin_role_permissions")
        .select(`
          id,
          role_id,
          permission_id,
          permission:admin_permissions (
            id,
            name,
            display_name,
            module,
            action,
            is_active
          )
        `)
        .in("role_id", roleIds);

      rawRolePermissions = rolePermissions || [];

      // Also try a direct query to see what's in the table
      const { data: directQuery } = await supabase
        .from("admin_role_permissions")
        .select("*")
        .in("role_id", roleIds);

      permissions = (rolePermissions || [])
        .map((rp: any) => rp.permission)
        .filter(Boolean);

      return NextResponse.json({
        session,
        roles,
        roleIds,
        permissions,
        permissionCount: permissions.length,
        permissionNames: permissions.map((p: any) => p.name),
        debug: {
          rawRolePermissions,
          directQuery,
          rpError,
        },
      });
    }

    return NextResponse.json({
      session,
      roles,
      permissions,
      permissionCount: permissions.length,
      permissionNames: permissions.map((p: any) => p.name),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}