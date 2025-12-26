// src/lib/utils/permissions.ts
// Created: Permission checking utilities for role-based access control

import type {
  AuthUser,
  PermissionModule,
  PermissionAction,
  PermissionName,
  UserRoleName,
  PermissionCheck,
} from "@/types/auth";
import { ROLES, PERMISSION_MODULES, PERMISSION_ACTIONS } from "@/lib/constants";

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Permission requirements for each route/feature
 * Maps routes to required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, PermissionCheck> = {
  // Dashboard
  "/": { module: "dashboard", action: "view" },
  
  // Events
  "/events": { module: "events", action: "view" },
  "/events/create": { module: "events", action: "create" },
  "/events/[id]": { module: "events", action: "edit" },
  
  // Promotions
  "/promotions": { module: "promotions", action: "view" },
  "/promotions/create": { module: "promotions", action: "create" },
  "/promotions/[id]": { module: "promotions", action: "edit" },
  
  // Blog
  "/blog": { module: "posts", action: "view" },
  "/blog/create": { module: "posts", action: "create" },
  "/blog/[id]": { module: "posts", action: "edit" },
  "/blog/categories": { module: "posts", action: "manage" },
  
  // Homepage content
  "/whats-on": { module: "whats_on", action: "view" },
  "/featured-restaurants": { module: "featured_restaurants", action: "view" },
  
  // Tenants
  "/tenants": { module: "tenants", action: "view" },
  "/tenants/create": { module: "tenants", action: "create" },
  "/tenants/[id]": { module: "tenants", action: "edit" },
  "/tenants/categories": { module: "tenant_categories", action: "view" },
  
  // Site settings
  "/site-settings": { module: "seo_settings", action: "view" },
  
  // Contacts
  "/contacts": { module: "contacts", action: "view" },
  "/contacts/[id]": { module: "contacts", action: "view" },
  
  // Admin users
  "/admin-users": { module: "admin_users", action: "view" },
  "/admin-users/[id]": { module: "admin_users", action: "edit" },
  "/admin-users/roles": { module: "admin_roles", action: "view" },
  
  // VIP Cards
  "/vip-cards": { module: "dashboard", action: "view" },
  "/vip-cards/tiers": { module: "dashboard", action: "view" },
  "/vip-cards/benefits": { module: "dashboard", action: "view" },
  
  // Audit logs
  "/audit-logs": { module: "activity_logs", action: "view" },
  
  // Profile (always accessible to authenticated users)
  "/profile": { module: "dashboard", action: "view" },
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function checkPermission(
  user: AuthUser | null,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  if (!user) return false;
  
  // Super admins bypass all permission checks
  if (isSuperAdmin(user)) return true;
  
  const permissionName: PermissionName = `${module}.${action}`;
  return user.permissions.has(permissionName);
}

/**
 * Check if user has permission for a route
 */
export function checkRoutePermission(
  user: AuthUser | null,
  pathname: string
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  
  // Normalize pathname (replace dynamic segments)
  const normalizedPath = pathname
    .replace(/\/[a-f0-9-]{36}/g, "/[id]") // UUID pattern
    .replace(/\/\d+/g, "/[id]"); // Numeric ID pattern
  
  const permission = ROUTE_PERMISSIONS[normalizedPath];
  
  if (!permission) {
    // No permission defined, default to allowing access
    // You might want to change this to false for stricter security
    return true;
  }
  
  return checkPermission(user, permission.module, permission.action);
}

/**
 * Check if user has any of the given permissions
 */
export function checkAnyPermission(
  user: AuthUser | null,
  permissions: PermissionCheck[]
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  
  return permissions.some((p) => checkPermission(user, p.module, p.action));
}

/**
 * Check if user has all of the given permissions
 */
export function checkAllPermissions(
  user: AuthUser | null,
  permissions: PermissionCheck[]
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  
  return permissions.every((p) => checkPermission(user, p.module, p.action));
}

// ============================================================================
// ROLE CHECK FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific role
 */
export function checkRole(
  user: AuthUser | null,
  roleName: UserRoleName
): boolean {
  if (!user) return false;
  return user.roles.some((r) => r.name === roleName);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return checkRole(user, ROLES.SUPER_ADMIN as UserRoleName);
}

/**
 * Check if user is content manager (or higher)
 */
export function isContentManager(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    isSuperAdmin(user) ||
    checkRole(user, ROLES.CONTENT_MANAGER as UserRoleName)
  );
}

/**
 * Check if user is operations manager (or higher)
 */
export function isOperationsManager(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    isSuperAdmin(user) ||
    checkRole(user, ROLES.OPERATIONS_MANAGER as UserRoleName)
  );
}

/**
 * Check if user has any management role
 */
export function hasManagementRole(user: AuthUser | null): boolean {
  if (!user) return false;
  const managementRoles: UserRoleName[] = [
    "super_admin",
    "content_manager",
    "operations_manager",
    "leasing_manager",
  ];
  return user.roles.some((r) => managementRoles.includes(r.name));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user's highest role (for display purposes)
 */
export function getHighestRole(user: AuthUser | null): UserRoleName | null {
  if (!user || user.roles.length === 0) return null;
  
  const roleHierarchy: UserRoleName[] = [
    "super_admin",
    "content_manager",
    "operations_manager",
    "leasing_manager",
    "viewer",
  ];
  
  for (const role of roleHierarchy) {
    if (user.roles.some((r) => r.name === role)) {
      return role;
    }
  }
  
  return user.roles[0].name;
}

/**
 * Get list of modules user can access
 */
export function getAccessibleModules(user: AuthUser | null): PermissionModule[] {
  if (!user) return [];
  if (isSuperAdmin(user)) {
    return Object.values(PERMISSION_MODULES) as PermissionModule[];
  }
  
  const modules = new Set<PermissionModule>();
  
  user.permissions.forEach((permission) => {
    const [module] = permission.split(".") as [PermissionModule, PermissionAction];
    modules.add(module);
  });
  
  return Array.from(modules);
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions<T extends { href: string }>(
  items: T[],
  user: AuthUser | null
): T[] {
  if (!user) return [];
  if (isSuperAdmin(user)) return items;
  
  return items.filter((item) => {
    const permission = ROUTE_PERMISSIONS[item.href];
    if (!permission) return true;
    return checkPermission(user, permission.module, permission.action);
  });
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(
  module: PermissionModule,
  action: PermissionAction
): string {
  const moduleNames: Record<PermissionModule, string> = {
    dashboard: "Dashboard",
    analytics: "Analytics",
    events: "Events",
    posts: "Blog Posts",
    promotions: "Promotions",
    tenants: "Tenants",
    tenant_categories: "Tenant Categories",
    whats_on: "What's On",
    featured_restaurants: "Featured Restaurants",
    contacts: "Contacts",
    admin_users: "Admin Users",
    admin_roles: "Admin Roles",
    seo_settings: "SEO Settings",
    activity_logs: "Activity Logs",
  };
  
  const actionNames: Record<PermissionAction, string> = {
    view: "View",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    publish: "Publish",
    manage: "Manage",
    manage_roles: "Manage Roles",
    respond: "Respond",
    feature: "Feature",
  };
  
  return `${actionNames[action]} ${moduleNames[module]}`;
}
