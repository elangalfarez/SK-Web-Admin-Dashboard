// src/components/users/reset-password-form.tsx
// Created: Reset password form component for admin users

"use client";

import { useState, useTransition } from "react";
import { Key, Eye, EyeOff, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";
import { resetUserPassword } from "@/actions/users";

// ============================================================================
// TYPES
// ============================================================================

interface ResetPasswordFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  new_password: string;
  confirm_password: string;
  send_notification: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ResetPasswordForm({
  userId,
  onSuccess,
  onCancel,
}: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    new_password: "",
    confirm_password: "",
    send_notification: true,
  });

  // Generate random password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    // Ensure at least one of each required character type
    password += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
    password += "abcdefghjkmnpqrstuvwxyz"[Math.floor(Math.random() * 23)];
    password += "23456789"[Math.floor(Math.random() * 8)];
    password += "!@#$%"[Math.floor(Math.random() * 5)];
    // Fill rest randomly
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    // Shuffle
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData((prev) => ({
      ...prev,
      new_password: password,
      confirm_password: password,
    }));
  };

  // Check password validity
  const meetsRequirements = passwordRequirements.every((req) =>
    req.test(formData.new_password)
  );
  const passwordsMatch =
    formData.new_password === formData.confirm_password &&
    formData.confirm_password.length > 0;

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetsRequirements) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const data = new FormData();
      data.set("new_password", formData.new_password);
      data.set("confirm_password", formData.confirm_password);
      data.set("send_notification", String(formData.send_notification));

      const result = await resetUserPassword(userId, data);

      if (result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="new_password" required>
            <Key className="mr-1 inline h-3 w-3" />
            New Password
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generatePassword}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Generate
          </Button>
        </div>
        <div className="relative">
          <Input
            id="new_password"
            type={showPassword ? "text" : "password"}
            value={formData.new_password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, new_password: e.target.value }))
            }
            placeholder="Enter new password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Password Requirements */}
      {formData.new_password && (
        <div className="rounded-lg border border-border p-3 space-y-1">
          {passwordRequirements.map((req, index) => {
            const passes = req.test(formData.new_password);
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  passes ? "text-success" : "text-muted-foreground"
                )}
              >
                {passes ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {req.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm_password" required>
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {formData.confirm_password && !passwordsMatch && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            Passwords match
          </p>
        )}
      </div>

      {/* Send Notification */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="send_notification">Send Notification</Label>
          <p className="text-sm text-muted-foreground">
            Email the user their new password
          </p>
        </div>
        <Switch
          id="send_notification"
          checked={formData.send_notification}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, send_notification: checked }))
          }
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !meetsRequirements || !passwordsMatch}
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </Button>
      </DialogFooter>
    </form>
  );
}
