// src/app/(dashboard)/settings/profile/page.tsx
// Created: Profile settings page for current user

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { ProfileForm } from "@/components/users/profile-form";
import { ChangePasswordForm } from "@/components/users/change-password-form";
import { getCurrentSession } from "@/actions/auth";
import { getUser } from "@/actions/users";

export const metadata: Metadata = {
  title: "Profile Settings",
};

export default async function ProfilePage() {
  const session = await getCurrentSession();
  
  if (!session) {
    redirect("/login");
  }

  const userResult = await getUser(session.userId);
  
  if (!userResult.success) {
    redirect("/");
  }

  const user = userResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account information and security"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Information */}
        <ProfileForm user={user} />

        {/* Change Password */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
