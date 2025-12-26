// src/components/settings/scripts-manager.tsx
// Created: Custom scripts and code injection manager

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Code,
  Power,
  PowerOff,
  GripVertical,
  FileCode,
  Link as LinkIcon,
  Braces,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSiteSettings,
  createSiteSetting,
  updateSiteSetting,
  deleteSiteSetting,
  toggleSettingStatus,
} from "@/actions/settings";
import type { SiteSetting, SiteSettingType, InjectionPoint } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface ScriptFormData {
  key: string;
  display_name: string;
  description: string;
  value: string;
  setting_type: SiteSettingType;
  injection_point: InjectionPoint;
  is_active: boolean;
  sort_order: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const settingTypeLabels: Record<SiteSettingType, { label: string; icon: typeof Code }> = {
  meta_tag: { label: "Meta Tag", icon: FileText },
  script: { label: "Script", icon: Code },
  link: { label: "Link", icon: LinkIcon },
  json_ld: { label: "JSON-LD", icon: Braces },
  custom_html: { label: "Custom HTML", icon: FileCode },
};

const injectionPointLabels: Record<InjectionPoint, string> = {
  head_start: "Head (Start)",
  head_end: "Head (End)",
  body_start: "Body (Start)",
  body_end: "Body (End)",
};

const defaultFormData: ScriptFormData = {
  key: "",
  display_name: "",
  description: "",
  value: "",
  setting_type: "script",
  injection_point: "head_end",
  is_active: true,
  sort_order: 0,
};

// ============================================================================
// SCRIPT FORM
// ============================================================================

interface ScriptFormProps {
  script?: SiteSetting;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function ScriptForm({ script, onSubmit, onCancel, isPending }: ScriptFormProps) {
  const [formData, setFormData] = useState<ScriptFormData>(() => {
    if (script) {
      return {
        key: script.key,
        display_name: script.display_name,
        description: script.description || "",
        value: script.value || "",
        setting_type: script.setting_type,
        injection_point: script.injection_point,
        is_active: script.is_active,
        sort_order: script.sort_order,
      };
    }
    return defaultFormData;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.set(key, String(value));
    });
    onSubmit(data);
  };

  // Auto-generate key from display name
  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      display_name: value,
      key: prev.key || value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display_name" required>Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            placeholder="Google Analytics Script"
            required
          />
        </div>

        {/* Key */}
        <div className="space-y-2">
          <Label htmlFor="key" required>Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              }))
            }
            placeholder="google_analytics"
            required
            disabled={!!script}
          />
          <p className="text-xs text-muted-foreground">
            Lowercase alphanumeric with underscores
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Tracks page views and user behavior"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="setting_type">Type</Label>
          <Select
            value={formData.setting_type}
            onValueChange={(value: SiteSettingType) =>
              setFormData((prev) => ({ ...prev, setting_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(settingTypeLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Injection Point */}
        <div className="space-y-2">
          <Label htmlFor="injection_point">Injection Point</Label>
          <Select
            value={formData.injection_point}
            onValueChange={(value: InjectionPoint) =>
              setFormData((prev) => ({ ...prev, injection_point: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(injectionPointLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Code/Value */}
      <div className="space-y-2">
        <Label htmlFor="value">Code / Content</Label>
        <Textarea
          id="value"
          value={formData.value}
          onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
          placeholder="Paste your script or HTML code here..."
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {formData.setting_type === "script" && "Include the full <script> tags"}
          {formData.setting_type === "meta_tag" && "Include the full <meta> tag"}
          {formData.setting_type === "link" && "Include the full <link> tag"}
          {formData.setting_type === "json_ld" && "Include the full <script type=\"application/ld+json\"> block"}
          {formData.setting_type === "custom_html" && "Any valid HTML"}
        </p>
      </div>

      {/* Active */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="is_active">Active</Label>
          <p className="text-sm text-muted-foreground">Enable this script on the website</p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : script ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScriptsManager() {
  const router = useRouter();
  const [scripts, setScripts] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<SiteSetting | null>(null);
  const [deletingScript, setDeletingScript] = useState<SiteSetting | null>(null);

  // Fetch scripts
  const fetchScripts = async () => {
    setIsLoading(true);
    const result = await getSiteSettings();
    if (result.success) {
      // Filter out settings groups (they start with settings_)
      setScripts(result.data.filter((s) => !s.key.startsWith("settings_")));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  // Handle create
  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createSiteSetting(formData);
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchScripts();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle update
  const handleUpdate = async (formData: FormData) => {
    if (!editingScript) return;

    startTransition(async () => {
      const result = await updateSiteSetting(editingScript.id, formData);
      if (result.success) {
        toast.success(result.message);
        setEditingScript(null);
        fetchScripts();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingScript) return;

    startTransition(async () => {
      const result = await deleteSiteSetting(deletingScript.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingScript(null);
        fetchScripts();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle toggle status
  const handleToggleStatus = (script: SiteSetting) => {
    startTransition(async () => {
      const result = await toggleSettingStatus(script.id, !script.is_active);
      if (result.success) {
        toast.success(result.message);
        fetchScripts();
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
              <Code className="h-5 w-5" />
              Custom Scripts
            </CardTitle>
            <CardDescription>
              Inject custom code into your website
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Script
          </Button>
        </CardHeader>
        <CardContent>
          {scripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No custom scripts yet</p>
              <p className="text-sm">Add scripts for analytics, tracking, or custom functionality.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scripts.map((script) => {
                const TypeInfo = settingTypeLabels[script.setting_type];
                const TypeIcon = TypeInfo?.icon || Code;

                return (
                  <div
                    key={script.id}
                    className={cn(
                      "flex items-center justify-between py-3",
                      !script.is_active && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{script.display_name}</p>
                          {!script.is_active && (
                            <Badge variant="inactive" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {TypeInfo?.label || script.setting_type}
                          </Badge>
                          <span>•</span>
                          <span>{injectionPointLabels[script.injection_point]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleStatus(script)}
                        disabled={isPending}
                      >
                        {script.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingScript(script)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingScript(script)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Script</DialogTitle>
            <DialogDescription>
              Add a script or code snippet to inject into your website.
            </DialogDescription>
          </DialogHeader>
          <ScriptForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Script</DialogTitle>
            <DialogDescription>
              Update script settings and code.
            </DialogDescription>
          </DialogHeader>
          {editingScript && (
            <ScriptForm
              script={editingScript}
              onSubmit={handleUpdate}
              onCancel={() => setEditingScript(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingScript} onOpenChange={() => setDeletingScript(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Script</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingScript?.display_name}"?
              This will remove the script from your website.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingScript(null)}>
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
