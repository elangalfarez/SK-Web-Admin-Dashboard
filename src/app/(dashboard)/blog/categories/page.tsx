// src/app/(dashboard)/blog/categories/page.tsx
// Created: Blog categories management page

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { CategoriesManager } from "@/components/blog/categories-manager";

export const metadata: Metadata = {
  title: "Blog Categories",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Blog Categories"
          description="Organize your blog posts with categories"
          className="mb-0"
        />
      </div>
      
      <div className="max-w-2xl">
        <CategoriesManager />
      </div>
    </div>
  );
}
