// src/types/auth.ts
// Created: Authentication and authorization type definitions

import type { AdminRole } from "./database";

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRoleName =
  | "super_admin"
  | "content_manager"
  | "operations_manager"
  | "leasing_manager"
  | "viewer";

export interface UserRole {
  id: string;
  name: UserRoleName;
  display_name: string;
  description: string | null;
  color: string;
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export type PermissionModule =
  | "dashboard"
  | "analytics"
  | "events"
  | "posts"
  | "promotions"
  | "tenants"
  | "tenant_categories"
  | "whats_on"
  | "featured_restaurants"
  | "contacts"
  | "admin_users"
  | "admin_roles"
  | "seo_settings"
  | "activity_logs";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "manage"
  | "manage_roles"
  | "respond"
  | "feature";

export type PermissionName = `${PermissionModule}.${PermissionAction}`;

export interface Permission {
  id: string;
  name: PermissionName;
  display_name: string;
  description: string | null;
  module: PermissionModule;
  action: PermissionAction;
}

// ============================================================================
// SESSION & AUTH STATE
// ============================================================================

/**
 * Current authenticated admin user with their roles and permissions
 */
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  roles: UserRole[];
  permissions: Set<PermissionName>;
  created_at: string;
  updated_at: string;
}

/**
 * Session data stored in cookies/local state
 */
export interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Magic link request
 */
export interface MagicLinkRequest {
  email: string;
  redirectTo?: string;
}

/**
 * Auth response from login operations
 */
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Permission check configuration
 */
export interface PermissionCheck {
  module: PermissionModule;
  action: PermissionAction;
}

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Resource-level permission check
 */
export interface ResourcePermissionCheck extends PermissionCheck {
  resourceId?: string;
  resourceOwnerId?: string;
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

/**
 * Auth context value provided to components
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signInWithMagicLink: (request: MagicLinkRequest) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  hasAnyPermission: (permissions: PermissionCheck[]) => boolean;
  hasAllPermissions: (permissions: PermissionCheck[]) => boolean;
  hasRole: (roleName: UserRoleName) => boolean;
  isSuperAdmin: boolean;
}

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

/**
 * Create admin user request
 */
export interface CreateAdminUserRequest {
  email: string;
  full_name: string;
  password: string;
  role_ids: string[];
  is_active?: boolean;
}

/**
 * Update admin user request
 */
export interface UpdateAdminUserRequest {
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  is_active?: boolean;
  role_ids?: string[];
}

/**
 * Admin user list item (for tables)
 */
export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  roles: Pick<AdminRole, "id" | "name" | "display_name" | "color">[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Role with permissions for management UI
 */
export interface RoleWithPermissions {
  id: string;
  name: UserRoleName;
  display_name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  permissions: Permission[];
  user_count?: number;
}

/**
 * Update role permissions request
 */
export interface UpdateRolePermissionsRequest {
  role_id: string;
  permission_ids: string[];
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Activity log entry for audit trail
 */
export interface ActivityLogEntry {
  user_id: string;
  action: string;
  module: PermissionModule;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Activity log action types
 */
export type ActivityAction =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "view"
  | "export"
  | "import"
  | "assign_role"
  | "remove_role"
  | "change_password"
  | "reset_password";
