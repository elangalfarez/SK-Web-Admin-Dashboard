// src/app/(dashboard)/blog/create/page.tsx
// Created: Create new blog post page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { BlogPostForm } from "@/components/blog/blog-post-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Create Post",
};

export default async function CreatePostPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "posts",
    "create"
  );

  if (!hasPermission) {
    redirect("/blog");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Post"
        description="Write a new blog post"
      />
      <BlogPostForm mode="create" />
    </div>
  );
}
