// src/app/(dashboard)/blog/[id]/edit/page.tsx
// Created: Edit blog post page

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { BlogPostForm } from "@/components/blog/blog-post-form";
import { getPost } from "@/actions/blog";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPost(id);

  if (!result.success || !result.data) {
    return { title: "Post Not Found" };
  }

  return {
    title: `Edit: ${result.data.title}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPost(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Post"
        description={`Editing: ${result.data.title}`}
      />
      <BlogPostForm post={result.data} mode="edit" />
    </div>
  );
}
