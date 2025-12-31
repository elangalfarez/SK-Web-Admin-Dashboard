// src/components/users/user-form.tsx
// Created: User create/edit form component

"use client";

import { useState, useEffect, useTransition } from "react";
import { User, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { SingleImageUploader } from "@/components/shared/image-uploader";
import { createUser, updateUser, getRoles } from "@/actions/users";
import type { UserWithRoles } from "@/actions/users";
import type { AdminRole } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface UserFormProps {
  user?: UserWithRoles;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  email: string;
  full_name: string;
  avatar_url: string;
  is_active: boolean;
  role_ids: string[];
  send_invitation: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [formData, setFormData] = useState<FormData>(() => {
    if (user) {
      return {
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url || "",
        is_active: user.is_active,
        role_ids: user.roles.map((r) => r.id),
        send_invitation: false,
      };
    }
    return {
      email: "",
      full_name: "",
      avatar_url: "",
      is_active: true,
      role_ids: [],
      send_invitation: true,
    };
  });

  // Load roles
  useEffect(() => {
    getRoles().then((result) => {
      if (result.success) {
        setRoles(result.data.filter((r) => r.is_active));
      }
      setLoadingRoles(false);
    });
  }, []);

  // Handle role selection
  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: checked
        ? [...prev.role_ids, roleId]
        : prev.role_ids.filter((id) => id !== roleId),
    }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const data = new FormData();
      data.set("email", formData.email);
      data.set("full_name", formData.full_name);
      data.set("avatar_url", formData.avatar_url);
      data.set("is_active", String(formData.is_active));
      data.set("role_ids", JSON.stringify(formData.role_ids));
      data.set("send_invitation", String(formData.send_invitation));

      const result = user
        ? await updateUser(user.id, data)
        : await createUser(data);

      if (result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  const isEditing = !!user;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name" required>
          <User className="mr-1 inline h-3 w-3" />
          Full Name
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, full_name: e.target.value }))
          }
          placeholder="John Doe"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" required>
          <Mail className="mr-1 inline h-3 w-3" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="john@example.com"
          required
        />
      </div>

      {/* Avatar (only for edit) */}
      {isEditing && (
        <div className="space-y-2">
          <Label>Avatar</Label>
          <SingleImageUploader
            value={formData.avatar_url || null}
            onChange={(url: string | null) =>
              setFormData((prev) => ({ ...prev, avatar_url: url || "" }))
            }
            bucket="AVATARS"
            folder="admin"
            aspectRatio="square"
          />
        </div>
      )}

      {/* Roles */}
      <div className="space-y-2">
        <Label required>
          <Shield className="mr-1 inline h-3 w-3" />
          Roles
        </Label>
        {loadingRoles ? (
          <div className="h-20 animate-pulse rounded-md bg-muted" />
        ) : roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles available. Create roles first.
          </p>
        ) : (
          <div className="rounded-lg border border-border p-3 space-y-2">
            {roles.map((role) => {
              const isSelected = formData.role_ids.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleRoleChange(role.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium">{role.display_name}</span>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
        {formData.role_ids.length === 0 && (
          <p className="text-xs text-destructive">
            At least one role is required
          </p>
        )}
      </div>

      {/* Active Status (only for edit) */}
      {isEditing && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="is_active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Allow user to access the admin panel
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
      )}

      {/* Send Invitation (only for create) */}
      {!isEditing && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="send_invitation">Send Invitation Email</Label>
            <p className="text-sm text-muted-foreground">
              Email the user their login credentials
            </p>
          </div>
          <Switch
            id="send_invitation"
            checked={formData.send_invitation}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, send_invitation: checked }))
            }
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || formData.role_ids.length === 0}
        >
          {isPending ? "Saving..." : isEditing ? "Update User" : "Create User"}
        </Button>
      </DialogFooter>
    </form>
  );
}
