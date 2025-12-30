// src/components/users/profile-form.tsx
// Created: Profile edit form for current user

"use client";

import { useState, useTransition } from "react";
import { User, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SingleImageUploader } from "@/components/shared/image-uploader";
import { updateOwnProfile } from "@/actions/users";
import type { UserWithRoles } from "@/actions/users";

// ============================================================================
// TYPES
// ============================================================================

interface ProfileFormProps {
  user: UserWithRoles;
}

interface FormData {
  full_name: string;
  email: string;
  avatar_url: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<FormData>({
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const data = new FormData();
      data.set("full_name", formData.full_name);
      data.set("avatar_url", formData.avatar_url);

      const result = await updateOwnProfile(data);
      if (result.success) {
        toast.success(result.message || "Profile updated successfully");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information and avatar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <SingleImageUploader
              value={formData.avatar_url || null}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, avatar_url: url || "" }))
              }
              bucket="avatars"
              folder="admin"
              aspectRatio="square"
              maxSize={1024 * 1024}
              className="w-32"
            />
          </div>

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
              placeholder="Your name"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="mr-1 inline h-3 w-3" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact an administrator if needed.
            </p>
          </div>

          {/* Roles (Read-only) */}
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge
                  key={role.id}
                  variant="outline"
                  style={{
                    borderColor: role.color,
                    backgroundColor: `${role.color}15`,
                  }}
                >
                  {role.display_name}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
