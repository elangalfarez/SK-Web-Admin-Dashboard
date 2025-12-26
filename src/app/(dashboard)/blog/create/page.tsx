// src/app/(dashboard)/blog/create/page.tsx
// Created: Create new blog post page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export const metadata: Metadata = {
  title: "Create Post",
};

export default function CreatePostPage() {
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
