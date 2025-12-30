// src/components/providers/auth-provider.tsx
// Created: Authentication context provider for managing auth state

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  AuthUser,
  AuthContextValue,
  PermissionModule,
  PermissionAction,
  PermissionCheck,
  UserRoleName,
  PermissionName,
  UserRole,
} from "@/types/auth";

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const router = useRouter();

  // Fetch user data from admin_users table
  const fetchUser = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      const supabase = createClient();

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

      // Type assertion needed because Supabase join returns object but TS infers array
      type RoleData = { id: string; name: string; display_name: string; description: string | null; color: string };
      const roles: UserRole[] = (userRoles || [])
        .map((ur) => ur.role as unknown as RoleData | null)
        .filter((r): r is RoleData => r !== null)
        .map((r) => ({
          id: r.id,
          name: r.name as UserRoleName,
          display_name: r.display_name,
          description: r.description,
          color: r.color,
        }));

      // Get permissions through roles
      const roleIds = roles.map((r) => r.id);

      let permissionNames = new Set<PermissionName>();

      if (roleIds.length > 0) {
        const { data: rolePermissions } = await supabase
          .from("admin_role_permissions")
          .select(`
            permission:admin_permissions (
              name
            )
          `)
          .in("role_id", roleIds);

        // Type assertion needed because Supabase join returns object but TS infers array
        type PermissionData = { name: string } | null;
        permissionNames = new Set<PermissionName>(
          (rolePermissions || [])
            .map((rp) => (rp.permission as unknown as PermissionData)?.name)
            .filter((name): name is PermissionName => name !== null && name !== undefined)
        );
      }

      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        is_active: userData.is_active,
        roles,
        permissions: permissionNames,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
    } catch (error) {
      console.error("Fetch user error:", error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Set a maximum time for auth initialization to prevent infinite loading
      const authTimeout = setTimeout(() => {
        console.warn("Auth initialization timed out");
        setIsLoading(false);
      }, 8000); // 8 second timeout

      try {
        const supabase = createClient();

        // Check for Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email) {
          // Get admin user by email
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("id")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

          if (adminUser) {
            const authUser = await fetchUser(adminUser.id);
            setUser(authUser);
          }
        } else {
          // Check for custom session cookie (via API) with timeout
          try {
            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 3000);

            const response = await fetch("/api/auth/session", {
              signal: controller.signal,
            });
            clearTimeout(fetchTimeout);

            if (response.ok) {
              const data = await response.json();
              if (data.userId) {
                const authUser = await fetchUser(data.userId);
                setUser(authUser);
              }
            }
          } catch {
            // Session endpoint might not exist or timed out
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        clearTimeout(authTimeout);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.email) {
          // Get admin user
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("id")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

          if (adminUser) {
            const authUser = await fetchUser(adminUser.id);
            setUser(authUser);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Sign in handler (not used directly - use server actions instead)
  const signIn = useCallback(async () => {
    throw new Error("Use server actions for sign in");
  }, []);

  // Sign in with magic link handler
  const signInWithMagicLink = useCallback(async () => {
    throw new Error("Use server actions for magic link sign in");
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user) return;
    const refreshedUser = await fetchUser(user.id);
    setUser(refreshedUser);
  }, [user, fetchUser]);

  // Permission checking
  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      if (!user) return false;
      if (user.roles.some((r) => r.name === "super_admin")) return true;
      const permissionName: PermissionName = `${module}.${action}`;
      return user.permissions.has(permissionName);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: PermissionCheck[]): boolean => {
      if (!user) return false;
      if (user.roles.some((r) => r.name === "super_admin")) return true;
      return permissions.some(({ module, action }) => hasPermission(module, action));
    },
    [user, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: PermissionCheck[]): boolean => {
      if (!user) return false;
      if (user.roles.some((r) => r.name === "super_admin")) return true;
      return permissions.every(({ module, action }) => hasPermission(module, action));
    },
    [user, hasPermission]
  );

  const hasRole = useCallback(
    (roleName: UserRoleName): boolean => {
      if (!user) return false;
      return user.roles.some((r) => r.name === roleName);
    },
    [user]
  );

  const isSuperAdmin = useMemo(() => hasRole("super_admin"), [hasRole]);

  // Context value
  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signInWithMagicLink,
      signOut,
      refreshUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      isSuperAdmin,
    }),
    [
      user,
      isLoading,
      signIn,
      signInWithMagicLink,
      signOut,
      refreshUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      isSuperAdmin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that only renders children if authenticated
 */
export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  children: ReactNode;
  module: PermissionModule;
  action: PermissionAction;
  fallback?: ReactNode;
}

/**
 * Wrapper component that only renders children if user has permission
 */
export function RequirePermission({
  children,
  module,
  action,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
