// src/components/users/change-password-form.tsx
// Created: Change password form for current user

"use client";

import { useState, useTransition } from "react";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { changeOwnPassword } from "@/actions/users";

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Check password requirements
  const meetsRequirements = passwordRequirements.map((req) => ({
    ...req,
    met: req.test(formData.new_password),
  }));

  const allRequirementsMet = meetsRequirements.every((r) => r.met);
  const passwordsMatch =
    formData.new_password === formData.confirm_password &&
    formData.confirm_password.length > 0;

  const canSubmit =
    formData.current_password.length > 0 &&
    allRequirementsMet &&
    passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    startTransition(async () => {
      const data = new FormData();
      data.set("current_password", formData.current_password);
      data.set("new_password", formData.new_password);
      data.set("confirm_password", formData.confirm_password);

      const result = await changeOwnPassword(data);
      if (result.success) {
        toast.success(result.message || "Password changed successfully");
        // Reset form
        setFormData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password" required>
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.current_password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    current_password: e.target.value,
                  }))
                }
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password" required>
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    new_password: e.target.value,
                  }))
                }
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.new_password.length > 0 && (
              <div className="mt-2 space-y-1 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Password requirements:
                </p>
                {meetsRequirements.map((req, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      req.met ? "text-green-600" : "text-muted-foreground"
                    )}
                  >
                    {req.met ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password" required>
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirm_password: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirm_password.length > 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  passwordsMatch ? "text-green-600" : "text-destructive"
                )}
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3" />
                    Passwords match
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    Passwords do not match
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending || !canSubmit}
            className="w-full"
          >
            {isPending ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
