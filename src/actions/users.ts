// src/actions/users.ts
// Created: Server actions for admin user management (CRUD, roles, invitations)

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity, hashPassword, verifyPassword } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  roleSchema,
} from "@/lib/validations/user";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminUserRole,
  PaginatedResult,
} from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface UserWithRoles extends AdminUser {
  roles: AdminRole[];
}

export interface RoleWithPermissions extends AdminRole {
  permissions: AdminPermission[];
}

export interface UserFilters {
  search?: string;
  status?: "all" | "active" | "inactive" | "pending";
  roleId?: string;
  page?: number;
  perPage?: number;
}

// ============================================================================
// GET ALL USERS (paginated)
// ============================================================================

export async function getUsers(
  filters: UserFilters = {}
): Promise<ActionResult<PaginatedResult<UserWithRoles>>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createClient();
    const { page = 1, perPage = 20, search, status, roleId } = filters;

    // Build base query
    let query = supabase
      .from("admin_users")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      }
      // "pending" would be users without password set - handled differently
    }

    // Apply sorting and pagination
    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch roles for each user
    const usersWithRoles: UserWithRoles[] = [];
    
    for (const user of users || []) {
      const { data: userRoles } = await supabase
        .from("admin_user_roles")
        .select(`
          role:admin_roles (*)
        `)
        .eq("user_id", user.id);

      const roles = (userRoles || [])
        .map((ur: any) => ur.role)
        .filter(Boolean) as AdminRole[];

      // Filter by role if specified
      if (roleId && !roles.some((r) => r.id === roleId)) {
        continue;
      }

      usersWithRoles.push({
        ...user,
        roles,
      });
    }

    return successResponse({
      data: usersWithRoles,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get users error:", error);
    return errorResponse("Failed to fetch users");
  }
}

// ============================================================================
// GET SINGLE USER
// ============================================================================

export async function getUser(id: string): Promise<ActionResult<UserWithRoles>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select(`
        role:admin_roles (*)
      `)
      .eq("user_id", id);

    const roles = (userRoles || [])
      .map((ur: any) => ur.role)
      .filter(Boolean) as AdminRole[];

    return successResponse({ ...user, roles });
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse("Failed to fetch user");
  }
}

// ============================================================================
// CREATE USER (Invitation)
// ============================================================================

export async function createUser(
  formData: FormData
): Promise<ActionResult<AdminUser>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role_ids: JSON.parse(formData.get("role_ids") as string || "[]"),
      send_invitation: formData.get("send_invitation") === "true",
    };

    // Validate
    const validated = createUserSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", data.email.toLowerCase())
      .single();

    if (existingUser) {
      return errorResponse("A user with this email already exists");
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create user
    const { data: user, error } = await supabase
      .from("admin_users")
      .insert({
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Assign roles
    for (const roleId of data.role_ids) {
      await supabase.from("admin_user_roles").insert({
        user_id: user.id,
        role_id: roleId,
        assigned_by: session.userId,
      });
    }

    // Log activity
    await logActivity(session.userId, "create", "users", {
      resourceType: "admin_user",
      resourceId: user.id,
      resourceName: user.full_name,
    });

    // TODO: Send invitation email with temp password if send_invitation is true
    // For now, we'll return the temp password in the message (in production, this should be emailed)

    revalidatePath("/users");

    return successResponse(
      user,
      data.send_invitation
        ? `User created. Temporary password: ${tempPassword}`
        : "User created successfully"
    );
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse("Failed to create user");
  }
}

// ============================================================================
// UPDATE USER
// ============================================================================

export async function updateUser(
  id: string,
  formData: FormData
): Promise<ActionResult<AdminUser>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      avatar_url: formData.get("avatar_url") as string || null,
      is_active: formData.get("is_active") === "true",
      role_ids: JSON.parse(formData.get("role_ids") as string || "[]"),
    };

    // Validate
    const validated = updateUserSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if email changed and already exists
    const { data: currentUser } = await supabase
      .from("admin_users")
      .select("email")
      .eq("id", id)
      .single();

    if (currentUser && currentUser.email !== data.email.toLowerCase()) {
      const { data: existingUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", data.email.toLowerCase())
        .single();

      if (existingUser) {
        return errorResponse("A user with this email already exists");
      }
    }

    // Update user
    const { data: user, error } = await supabase
      .from("admin_users")
      .update({
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        avatar_url: data.avatar_url || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Update roles - remove existing and add new
    await supabase.from("admin_user_roles").delete().eq("user_id", id);

    for (const roleId of data.role_ids) {
      await supabase.from("admin_user_roles").insert({
        user_id: id,
        role_id: roleId,
        assigned_by: session.userId,
      });
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "admin_user",
      resourceId: user.id,
      resourceName: user.full_name,
    });

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);

    return successResponse(user, "User updated successfully");
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Failed to update user");
  }
}

// ============================================================================
// DELETE USER
// ============================================================================

export async function deleteUser(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Prevent self-deletion
    if (id === session.userId) {
      return errorResponse("You cannot delete your own account");
    }

    const supabase = await createAdminClient();

    // Get user for logging
    const { data: user } = await supabase
      .from("admin_users")
      .select("full_name")
      .eq("id", id)
      .single();

    if (!user) {
      return errorResponse("User not found");
    }

    // Delete user roles first
    await supabase.from("admin_user_roles").delete().eq("user_id", id);

    // Delete user
    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "users", {
      resourceType: "admin_user",
      resourceId: id,
      resourceName: user.full_name,
    });

    revalidatePath("/users");

    return successResponse(undefined, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Failed to delete user");
  }
}

// ============================================================================
// TOGGLE USER STATUS
// ============================================================================

export async function toggleUserStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<AdminUser>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Prevent self-deactivation
    if (id === session.userId && !isActive) {
      return errorResponse("You cannot deactivate your own account");
    }

    const supabase = await createAdminClient();

    const { data: user, error } = await supabase
      .from("admin_users")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    revalidatePath("/users");

    return successResponse(user, isActive ? "User activated" : "User deactivated");
  } catch (error) {
    console.error("Toggle user status error:", error);
    return errorResponse("Failed to update user status");
  }
}

// ============================================================================
// RESET PASSWORD (Admin)
// ============================================================================

export async function resetUserPassword(
  userId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      new_password: formData.get("new_password") as string,
      confirm_password: formData.get("confirm_password") as string,
      send_notification: formData.get("send_notification") === "true",
    };

    // Validate
    const validated = resetPasswordSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Hash new password
    const passwordHash = await hashPassword(data.new_password);

    // Update password
    const { error } = await supabase
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "admin_user",
      resourceId: userId,
      resourceName: "Password reset",
    });

    // TODO: Send notification email if send_notification is true

    revalidatePath("/users");

    return successResponse(undefined, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Failed to reset password");
  }
}

// ============================================================================
// CHANGE OWN PASSWORD
// ============================================================================

export async function changePassword(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      current_password: formData.get("current_password") as string,
      new_password: formData.get("new_password") as string,
      confirm_password: formData.get("confirm_password") as string,
    };

    // Validate
    const validated = changePasswordSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Get current user
    const { data: user } = await supabase
      .from("admin_users")
      .select("password_hash")
      .eq("id", session.userId)
      .single();

    if (!user) {
      return errorResponse("User not found");
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      data.current_password,
      user.password_hash
    );

    if (!isValidPassword) {
      return errorResponse("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await hashPassword(data.new_password);

    // Update password
    const { error } = await supabase
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.userId);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "admin_user",
      resourceId: session.userId,
      resourceName: "Password changed",
    });

    return successResponse(undefined, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to change password");
  }
}

// ============================================================================
// GET ALL ROLES
// ============================================================================

export async function getRoles(): Promise<ActionResult<AdminRole[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("admin_roles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get roles error:", error);
    return errorResponse("Failed to fetch roles");
  }
}

// ============================================================================
// GET ROLE WITH PERMISSIONS
// ============================================================================

export async function getRole(id: string): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const supabase = await createClient();

    const { data: role, error } = await supabase
      .from("admin_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Fetch role permissions
    const { data: rolePermissions } = await supabase
      .from("admin_role_permissions")
      .select(`
        permission:admin_permissions (*)
      `)
      .eq("role_id", id);

    const permissions = (rolePermissions || [])
      .map((rp: any) => rp.permission)
      .filter(Boolean) as AdminPermission[];

    return successResponse({ ...role, permissions });
  } catch (error) {
    console.error("Get role error:", error);
    return errorResponse("Failed to fetch role");
  }
}

// ============================================================================
// GET ALL PERMISSIONS
// ============================================================================

export async function getPermissions(): Promise<ActionResult<AdminPermission[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("admin_permissions")
      .select("*")
      .eq("is_active", true)
      .order("module", { ascending: true })
      .order("action", { ascending: true });

    if (error) {
      return handleSupabaseError(error);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get permissions error:", error);
    return errorResponse("Failed to fetch permissions");
  }
}

// ============================================================================
// CREATE ROLE
// ============================================================================

export async function createRole(
  formData: FormData
): Promise<ActionResult<AdminRole>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      display_name: formData.get("display_name") as string,
      description: formData.get("description") as string || null,
      color: formData.get("color") as string || "#6366f1",
      is_active: formData.get("is_active") === "true",
      permission_ids: JSON.parse(formData.get("permission_ids") as string || "[]"),
    };

    // Validate
    const validated = roleSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if role name exists
    const { data: existingRole } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("name", data.name)
      .single();

    if (existingRole) {
      return errorResponse("A role with this name already exists");
    }

    // Get max sort order
    const { data: maxSort } = await supabase
      .from("admin_roles")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (maxSort?.sort_order || 0) + 1;

    // Create role
    const { data: role, error } = await supabase
      .from("admin_roles")
      .insert({
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        color: data.color,
        is_active: data.is_active,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Assign permissions
    for (const permissionId of data.permission_ids) {
      await supabase.from("admin_role_permissions").insert({
        role_id: role.id,
        permission_id: permissionId,
      });
    }

    // Log activity
    await logActivity(session.userId, "create", "users", {
      resourceType: "admin_role",
      resourceId: role.id,
      resourceName: role.display_name,
    });

    revalidatePath("/users");

    return successResponse(role, "Role created successfully");
  } catch (error) {
    console.error("Create role error:", error);
    return errorResponse("Failed to create role");
  }
}

// ============================================================================
// UPDATE ROLE
// ============================================================================

export async function updateRole(
  id: string,
  formData: FormData
): Promise<ActionResult<AdminRole>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      display_name: formData.get("display_name") as string,
      description: formData.get("description") as string || null,
      color: formData.get("color") as string || "#6366f1",
      is_active: formData.get("is_active") === "true",
      permission_ids: JSON.parse(formData.get("permission_ids") as string || "[]"),
    };

    // Validate
    const validated = roleSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check if role name changed and exists
    const { data: currentRole } = await supabase
      .from("admin_roles")
      .select("name")
      .eq("id", id)
      .single();

    if (currentRole && currentRole.name !== data.name) {
      const { data: existingRole } = await supabase
        .from("admin_roles")
        .select("id")
        .eq("name", data.name)
        .single();

      if (existingRole) {
        return errorResponse("A role with this name already exists");
      }
    }

    // Update role
    const { data: role, error } = await supabase
      .from("admin_roles")
      .update({
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        color: data.color,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Update permissions - remove existing and add new
    await supabase.from("admin_role_permissions").delete().eq("role_id", id);

    for (const permissionId of data.permission_ids) {
      await supabase.from("admin_role_permissions").insert({
        role_id: id,
        permission_id: permissionId,
      });
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "admin_role",
      resourceId: role.id,
      resourceName: role.display_name,
    });

    revalidatePath("/users");

    return successResponse(role, "Role updated successfully");
  } catch (error) {
    console.error("Update role error:", error);
    return errorResponse("Failed to update role");
  }
}

// ============================================================================
// DELETE ROLE
// ============================================================================

export async function deleteRole(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Check if role is assigned to any users
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select("id")
      .eq("role_id", id)
      .limit(1);

    if (userRoles && userRoles.length > 0) {
      return errorResponse("Cannot delete role that is assigned to users");
    }

    // Get role for logging
    const { data: role } = await supabase
      .from("admin_roles")
      .select("display_name")
      .eq("id", id)
      .single();

    if (!role) {
      return errorResponse("Role not found");
    }

    // Delete role permissions first
    await supabase.from("admin_role_permissions").delete().eq("role_id", id);

    // Delete role
    const { error } = await supabase
      .from("admin_roles")
      .delete()
      .eq("id", id);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "delete", "users", {
      resourceType: "admin_role",
      resourceId: id,
      resourceName: role.display_name,
    });

    revalidatePath("/users");

    return successResponse(undefined, "Role deleted successfully");
  } catch (error) {
    console.error("Delete role error:", error);
    return errorResponse("Failed to delete role");
  }
}

// ============================================================================
// UPDATE OWN PROFILE (current user)
// ============================================================================

export async function updateOwnProfile(
  formData: FormData
): Promise<ActionResult<AdminUser>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const full_name = formData.get("full_name") as string;
    const avatar_url = formData.get("avatar_url") as string || null;

    if (!full_name || full_name.trim().length < 2) {
      return errorResponse("Name must be at least 2 characters");
    }

    const supabase = await createAdminClient();

    const { data: user, error } = await supabase
      .from("admin_users")
      .update({
        full_name: full_name.trim(),
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.userId)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "profile",
      resourceId: session.userId,
      resourceName: "Own profile",
    });

    revalidatePath("/settings/profile");

    return successResponse(user, "Profile updated successfully");
  } catch (error) {
    console.error("Update own profile error:", error);
    return errorResponse("Failed to update profile");
  }
}

// ============================================================================
// CHANGE OWN PASSWORD (current user)
// ============================================================================

export async function changeOwnPassword(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const current_password = formData.get("current_password") as string;
    const new_password = formData.get("new_password") as string;
    const confirm_password = formData.get("confirm_password") as string;

    // Validate
    if (!current_password) {
      return errorResponse("Current password is required");
    }

    if (!new_password || new_password.length < 8) {
      return errorResponse("New password must be at least 8 characters");
    }

    if (!/[A-Z]/.test(new_password)) {
      return errorResponse("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(new_password)) {
      return errorResponse("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(new_password)) {
      return errorResponse("Password must contain at least one number");
    }

    if (new_password !== confirm_password) {
      return errorResponse("Passwords do not match");
    }

    const supabase = await createAdminClient();

    // Get current password hash
    const { data: userData } = await supabase
      .from("admin_users")
      .select("password_hash, full_name")
      .eq("id", session.userId)
      .single();

    if (!userData) {
      return errorResponse("User not found");
    }

    // Verify current password
    const isValid = await verifyPassword(current_password, userData.password_hash);
    if (!isValid) {
      return errorResponse("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update password
    const { error } = await supabase
      .from("admin_users")
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.userId);

    if (error) {
      return handleSupabaseError(error);
    }

    // Log activity
    await logActivity(session.userId, "update", "users", {
      resourceType: "password",
      resourceId: session.userId,
      resourceName: "Own password changed",
    });

    return successResponse(undefined, "Password changed successfully");
  } catch (error) {
    console.error("Change own password error:", error);
    return errorResponse("Failed to change password");
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
