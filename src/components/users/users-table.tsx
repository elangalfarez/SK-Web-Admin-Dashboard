// src/components/users/users-table.tsx
// Created: Users table component with pagination

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Key,
  MoreHorizontal,
  User,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UsersFilters, type UsersFiltersState } from "./users-filters";
import { UserForm } from "./user-form";
import { ResetPasswordForm } from "./reset-password-form";
import { getUsers, deleteUser, toggleUserStatus } from "@/actions/users";
import { formatDate } from "@/lib/utils/format-date";
import type { UserWithRoles } from "@/actions/users";
import type { PaginatedResult } from "@/types/database";

// ============================================================================
// DEFAULT FILTERS
// ============================================================================

const defaultFilters: UsersFiltersState = {
  search: "",
  status: "all",
  roleId: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UsersTable() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<UsersFiltersState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [data, setData] = useState<PaginatedResult<UserWithRoles> | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRoles | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithRoles | null>(null);

  // Fetch data
  const fetchData = () => {
    startTransition(async () => {
      const result = await getUsers({
        ...filters,
        page,
        perPage,
      });
      if (result.success) {
        setData(result.data);
      }
    });
  };

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchData();
  }, [filters, page]);

  // Reset page when filters change
  const handleFiltersChange = (newFilters: UsersFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const result = await deleteUser(deletingUser.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingUser(null);
        fetchData();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle toggle status
  const handleToggleStatus = (user: UserWithRoles) => {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id, !user.is_active);
      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error(result.error);
      }
    });
  };

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <UsersFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleReset}
        />
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <User className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No users found</p>
              <p className="text-sm">Add users to manage admin access.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Roles
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50">
                        {/* User Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Roles */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: role.color,
                                  backgroundColor: `${role.color}15`,
                                }}
                              >
                                <Shield
                                  className="mr-1 h-3 w-3"
                                  style={{ color: role.color }}
                                />
                                {role.display_name}
                              </Badge>
                            ))}
                            {user.roles.length === 0 && (
                              <span className="text-sm text-muted-foreground">
                                No roles
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            variant={user.is_active ? "success" : "inactive"}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingUser(user)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setResetPasswordUser(user)}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.is_active ? (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingUser(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to{" "}
                  {Math.min(page * perPage, total)} of {total} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new admin user and send them an invitation.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchData();
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and roles.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSuccess={() => {
                setEditingUser(null);
                fetchData();
              }}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={() => setResetPasswordUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.full_name}.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordUser && (
            <ResetPasswordForm
              userId={resetPasswordUser.id}
              onSuccess={() => {
                setResetPasswordUser(null);
              }}
              onCancel={() => setResetPasswordUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingUser?.full_name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
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
    </div>
  );
}
