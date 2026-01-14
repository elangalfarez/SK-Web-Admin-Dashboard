// src/components/users/roles-manager.tsx
// Created: Admin roles information display (read-only)

"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoles } from "@/actions/users";
import type { AdminRole } from "@/types/database";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RolesManager() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      const result = await getRoles();
      if (result.success) {
        setRoles(result.data);
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Roles
        </CardTitle>
        <CardDescription>
          View admin roles and their permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {roles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No roles defined</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="font-medium">{role.display_name}</span>
                </div>

                {/* Description */}
                {role.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {role.description}
                  </p>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={role.is_active ? "success" : "inactive"}
                    className="text-xs"
                  >
                    {role.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {role.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
