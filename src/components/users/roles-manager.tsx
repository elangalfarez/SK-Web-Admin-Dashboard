// src/components/users/roles-manager.tsx
// Created: Admin roles management component

"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
} from "@/actions/users";
import type { AdminRole, AdminPermission } from "@/types/database";
import type { RoleWithPermissions } from "@/actions/users";

// ============================================================================
// TYPES
// ============================================================================

interface RoleFormData {
  name: string;
  display_name: string;
  description: string;
  color: string;
  is_active: boolean;
  permission_ids: string[];
}

const defaultFormData: RoleFormData = {
  name: "",
  display_name: "",
  description: "",
  color: "#6366f1",
  is_active: true,
  permission_ids: [],
};

// ============================================================================
// COLOR OPTIONS
// ============================================================================

const colorOptions = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#64748b", // Slate
];

// ============================================================================
// ROLE FORM
// ============================================================================

interface RoleFormProps {
  role?: RoleWithPermissions;
  permissions: AdminPermission[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function RoleForm({
  role,
  permissions,
  onSubmit,
  onCancel,
  isPending,
}: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>(() => {
    if (role) {
      return {
        name: role.name,
        display_name: role.display_name,
        description: role.description || "",
        color: role.color,
        is_active: role.is_active,
        permission_ids: role.permissions.map((p) => p.id),
      };
    }
    return defaultFormData;
  });

  // Auto-generate name from display name
  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      display_name: value,
      // Only auto-generate name if creating new role
      name: role
        ? prev.name
        : value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
    }));
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  // Handle permission toggle
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: checked
        ? [...prev.permission_ids, permissionId]
        : prev.permission_ids.filter((id) => id !== permissionId),
    }));
  };

  // Handle module toggle (select/deselect all in module)
  const handleModuleToggle = (module: string, checked: boolean) => {
    const modulePermissionIds = permissionsByModule[module].map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      permission_ids: checked
        ? [...new Set([...prev.permission_ids, ...modulePermissionIds])]
        : prev.permission_ids.filter((id) => !modulePermissionIds.includes(id)),
    }));
  };

  // Check if all module permissions are selected
  const isModuleSelected = (module: string) => {
    const modulePermissionIds = permissionsByModule[module].map((p) => p.id);
    return modulePermissionIds.every((id) => formData.permission_ids.includes(id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("name", formData.name);
    data.set("display_name", formData.display_name);
    data.set("description", formData.description);
    data.set("color", formData.color);
    data.set("is_active", String(formData.is_active));
    data.set("permission_ids", JSON.stringify(formData.permission_ids));
    onSubmit(data);
  };

  const isEditing = !!role;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="display_name" required>Display Name</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          placeholder="e.g., Content Manager"
          required
        />
      </div>

      {/* System Name */}
      <div className="space-y-2">
        <Label htmlFor="name" required>System Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., content_manager"
          pattern="^[a-z_]+$"
          title="Lowercase letters and underscores only"
          disabled={isEditing}
          required
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters and underscores only
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="What can this role do?"
          rows={2}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color }))}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                formData.color === color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="is_active">Active</Label>
          <p className="text-sm text-muted-foreground">
            Allow this role to be assigned
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, is_active: checked }))
          }
        />
      </div>

      {/* Permissions */}
      <div className="space-y-2">
        <Label>
          <Lock className="mr-1 inline h-3 w-3" />
          Permissions
        </Label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
          {Object.entries(permissionsByModule).map(([module, modulePerms]) => (
            <div key={module} className="border-b border-border last:border-b-0">
              {/* Module Header */}
              <label className="flex cursor-pointer items-center gap-3 bg-muted/50 px-3 py-2">
                <Checkbox
                  checked={isModuleSelected(module)}
                  onCheckedChange={(checked) =>
                    handleModuleToggle(module, checked as boolean)
                  }
                />
                <span className="font-medium capitalize">{module}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {modulePerms.filter((p) => formData.permission_ids.includes(p.id)).length}
                  /{modulePerms.length}
                </Badge>
              </label>
              {/* Module Permissions */}
              <div className="px-3 py-2 space-y-1">
                {modulePerms.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-center gap-3 rounded p-1 hover:bg-muted"
                  >
                    <Checkbox
                      checked={formData.permission_ids.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(permission.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <span className="text-sm">{permission.display_name}</span>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update Role" : "Create Role"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RolesManager() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [deletingRole, setDeletingRole] = useState<AdminRole | null>(null);

  // Fetch roles and permissions
  const fetchData = async () => {
    setIsLoading(true);
    const [rolesResult, permsResult] = await Promise.all([
      getRoles(),
      getPermissions(),
    ]);
    if (rolesResult.success) {
      setRoles(rolesResult.data);
    }
    if (permsResult.success) {
      setPermissions(permsResult.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle edit - load role with permissions
  const handleEdit = async (role: AdminRole) => {
    const result = await getRole(role.id);
    if (result.success) {
      setEditingRole(result.data);
    } else {
      toast.error(result.error);
    }
  };

  // Handle create
  const handleCreate = async (data: FormData) => {
    startTransition(async () => {
      const result = await createRole(data);
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchData();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle update
  const handleUpdate = async (data: FormData) => {
    if (!editingRole) return;

    startTransition(async () => {
      const result = await updateRole(editingRole.id, data);
      if (result.success) {
        toast.success(result.message);
        setEditingRole(null);
        fetchData();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingRole) return;

    startTransition(async () => {
      const result = await deleteRole(deletingRole.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingRole(null);
        fetchData();
      } else {
        toast.error(result.error);
      }
    });
  };

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
            <CardDescription>
              Manage admin roles and their permissions
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No roles defined</p>
              <p className="text-sm">Create roles to manage permissions.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium">{role.display_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingRole(role)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions.
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            permissions={permissions}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role settings and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <RoleForm
              role={editingRole}
              permissions={permissions}
              onSubmit={handleUpdate}
              onCancel={() => setEditingRole(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingRole?.display_name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRole(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
