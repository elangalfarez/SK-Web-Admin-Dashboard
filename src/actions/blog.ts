// src/actions/blog.ts
// Created: Server actions for blog posts and categories CRUD operations

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/auth";
import { getCurrentSession } from "./auth";
import { successResponse, errorResponse, handleSupabaseError } from "@/lib/utils/api-helpers";
import { generateSlug } from "@/lib/utils/slug";
import { createPostSchema, updatePostSchema, categorySchema, type PostFilters } from "@/lib/validations/blog";
import type { ActionResult } from "@/lib/utils/api-helpers";
import type { Post, BlogCategory, PostWithCategory, PaginatedResult } from "@/types/database";

// ============================================================================
// GET POSTS (with pagination and filters)
// ============================================================================

export async function getPosts(
  filters: PostFilters = { page: 1, perPage: 10 }
): Promise<ActionResult<PaginatedResult<PostWithCategory>>> {
  try {
    const supabase = await createClient();
    const { page, perPage, search, status, featured, categoryId, tags, sortBy, sortOrder } = filters;

    // Build query
    let query = supabase
      .from("posts")
      .select(`
        *,
        category:blog_categories (
          id,
          name,
          slug,
          color
        )
      `, { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("is_published", status === "published");
    }

    if (featured !== undefined) {
      query = query.eq("is_featured", featured);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (tags && tags.length > 0) {
      query = query.contains("tags", tags);
    }

    // Apply sorting
    const orderColumn = sortBy || "created_at";
    const orderDirection = sortOrder === "asc" ? true : false;
    query = query.order(orderColumn, { ascending: orderDirection });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse({
      data: (data || []) as PostWithCategory[],
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return errorResponse("Failed to fetch posts");
  }
}

// ============================================================================
// GET SINGLE POST
// ============================================================================

export async function getPost(id: string): Promise<ActionResult<PostWithCategory>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        category:blog_categories (
          id,
          name,
          slug,
          color
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data as PostWithCategory);
  } catch (error) {
    console.error("Get post error:", error);
    return errorResponse("Failed to fetch post");
  }
}

// ============================================================================
// GET POST BY SLUG
// ============================================================================

export async function getPostBySlug(slug: string): Promise<ActionResult<PostWithCategory>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        category:blog_categories (
          id,
          name,
          slug,
          color
        )
      `)
      .eq("slug", slug)
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data as PostWithCategory);
  } catch (error) {
    console.error("Get post by slug error:", error);
    return errorResponse("Failed to fetch post");
  }
}

// ============================================================================
// CREATE POST
// ============================================================================

export async function createPost(
  formData: FormData
): Promise<ActionResult<Post>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string || "",
      body: formData.get("body") as string || "",
      featured_image: formData.get("featured_image") as string || null,
      category_id: formData.get("category_id") as string || null,
      tags: JSON.parse(formData.get("tags") as string || "[]"),
      is_published: formData.get("is_published") === "true",
      is_featured: formData.get("is_featured") === "true",
      published_at: formData.get("published_at") as string || null,
      meta_title: formData.get("meta_title") as string || "",
      meta_description: formData.get("meta_description") as string || "",
    };

    // Validate
    const validated = createPostSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }

    const supabase = await createAdminClient();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", data.slug)
      .single();

    if (existing) {
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Set published_at if publishing
    let publishedAt = data.published_at || null;
    if (data.is_published && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    // Insert post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        body: data.body || null,
        featured_image: data.featured_image || null,
        category_id: data.category_id || null,
        tags: data.tags,
        is_published: data.is_published,
        is_featured: data.is_featured,
        published_at: publishedAt,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        author_id: session.userId,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "create", "blog", {
      resourceType: "post",
      resourceId: post.id,
      resourceName: post.title,
      newValues: { title: post.title, is_published: post.is_published },
    });

    // Revalidate pages
    revalidatePath("/blog");
    revalidatePath("/");

    return successResponse(post, "Post created successfully");
  } catch (error) {
    console.error("Create post error:", error);
    return errorResponse("Failed to create post");
  }
}

// ============================================================================
// UPDATE POST
// ============================================================================

export async function updatePost(
  id: string,
  formData: FormData
): Promise<ActionResult<Post>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    // Parse form data
    const rawData = {
      id,
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string || "",
      body: formData.get("body") as string || "",
      featured_image: formData.get("featured_image") as string || null,
      category_id: formData.get("category_id") as string || null,
      tags: JSON.parse(formData.get("tags") as string || "[]"),
      is_published: formData.get("is_published") === "true",
      is_featured: formData.get("is_featured") === "true",
      published_at: formData.get("published_at") as string || null,
      meta_title: formData.get("meta_title") as string || "",
      meta_description: formData.get("meta_description") as string || "",
    };

    // Validate
    const validated = updatePostSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Get current post for comparison
    const { data: currentPost } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentPost) {
      return errorResponse("Post not found");
    }

    // Check for duplicate slug (if changed)
    if (data.slug && data.slug !== currentPost.slug) {
      const { data: existing } = await supabase
        .from("posts")
        .select("id")
        .eq("slug", data.slug)
        .neq("id", id)
        .single();

      if (existing) {
        return errorResponse("A post with this slug already exists");
      }
    }

    // Set published_at if publishing for first time
    let publishedAt = data.published_at || currentPost.published_at;
    if (data.is_published && !currentPost.is_published && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    // Update post
    const { data: post, error } = await supabase
      .from("posts")
      .update({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        body: data.body || null,
        featured_image: data.featured_image || null,
        category_id: data.category_id || null,
        tags: data.tags,
        is_published: data.is_published,
        is_featured: data.is_featured,
        published_at: publishedAt,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "update", "blog", {
      resourceType: "post",
      resourceId: post.id,
      resourceName: post.title,
      oldValues: { title: currentPost.title, is_published: currentPost.is_published },
      newValues: { title: post.title, is_published: post.is_published },
    });

    // Revalidate pages
    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidatePath("/");

    return successResponse(post, "Post updated successfully");
  } catch (error) {
    console.error("Update post error:", error);
    return errorResponse("Failed to update post");
  }
}

// ============================================================================
// DELETE POST
// ============================================================================

export async function deletePost(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get post before deletion for logging
    const { data: post } = await supabase
      .from("posts")
      .select("id, title")
      .eq("id", id)
      .single();

    if (!post) {
      return errorResponse("Post not found");
    }

    // Delete post
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "delete", "blog", {
      resourceType: "post",
      resourceId: id,
      resourceName: post.title,
    });

    // Revalidate pages
    revalidatePath("/blog");
    revalidatePath("/");

    return successResponse(undefined, "Post deleted successfully");
  } catch (error) {
    console.error("Delete post error:", error);
    return errorResponse("Failed to delete post");
  }
}

// ============================================================================
// TOGGLE POST PUBLISH STATUS
// ============================================================================

export async function togglePostPublish(
  id: string,
  isPublished: boolean
): Promise<ActionResult<Post>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Get current post
    const { data: currentPost } = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .single();

    // Set published_at if publishing for first time
    let publishedAt = currentPost?.published_at;
    if (isPublished && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    const { data: post, error } = await supabase
      .from("posts")
      .update({
        is_published: isPublished,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, isPublished ? "publish" : "unpublish", "blog", {
      resourceType: "post",
      resourceId: post.id,
      resourceName: post.title,
    });

    // Revalidate pages
    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidatePath("/");

    return successResponse(post, isPublished ? "Post published" : "Post unpublished");
  } catch (error) {
    console.error("Toggle post publish error:", error);
    return errorResponse("Failed to update post");
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<ActionResult<BlogCategory[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data || []);
  } catch (error) {
    console.error("Get categories error:", error);
    return errorResponse("Failed to fetch categories");
  }
}

export async function getCategory(id: string): Promise<ActionResult<BlogCategory>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data);
  } catch (error) {
    console.error("Get category error:", error);
    return errorResponse("Failed to fetch category");
  }
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult<BlogCategory>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || "",
      color: formData.get("color") as string || "",
    };

    // Validate
    const validated = categorySchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }

    const supabase = await createAdminClient();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", data.slug)
      .single();

    if (existing) {
      return errorResponse("A category with this slug already exists");
    }

    // Insert category
    const { data: category, error } = await supabase
      .from("blog_categories")
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        color: data.color || null,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "create", "blog", {
      resourceType: "category",
      resourceId: category.id,
      resourceName: category.name,
    });

    revalidatePath("/blog/categories");

    return successResponse(category, "Category created successfully");
  } catch (error) {
    console.error("Create category error:", error);
    return errorResponse("Failed to create category");
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<BlogCategory>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || "",
      color: formData.get("color") as string || "",
    };

    // Validate
    const validated = categorySchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return errorResponse(firstError.message);
    }

    const data = validated.data;
    const supabase = await createAdminClient();

    // Check for duplicate slug (if changed)
    const { data: existing } = await supabase
      .from("blog_categories")
      .select("id, slug")
      .eq("id", id)
      .single();

    if (!existing) {
      return errorResponse("Category not found");
    }

    if (data.slug !== existing.slug) {
      const { data: duplicate } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", data.slug)
        .neq("id", id)
        .single();

      if (duplicate) {
        return errorResponse("A category with this slug already exists");
      }
    }

    // Update category
    const { data: category, error } = await supabase
      .from("blog_categories")
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        color: data.color || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "update", "blog", {
      resourceType: "category",
      resourceId: category.id,
      resourceName: category.name,
    });

    revalidatePath("/blog/categories");

    return successResponse(category, "Category updated successfully");
  } catch (error) {
    console.error("Update category error:", error);
    return errorResponse("Failed to update category");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Check if category has posts
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return errorResponse(`Cannot delete category with ${count} posts. Move or delete posts first.`);
    }

    // Get category for logging
    const { data: category } = await supabase
      .from("blog_categories")
      .select("name")
      .eq("id", id)
      .single();

    // Delete category
    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Log activity
    await logActivity(session.userId, "delete", "blog", {
      resourceType: "category",
      resourceId: id,
      resourceName: category?.name || "Unknown",
    });

    revalidatePath("/blog/categories");

    return successResponse(undefined, "Category deleted successfully");
  } catch (error) {
    console.error("Delete category error:", error);
    return errorResponse("Failed to delete category");
  }
}

// ============================================================================
// GET ALL TAGS (for autocomplete)
// ============================================================================

export async function getPostTags(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select("tags");

    if (error) {
      return errorResponse(handleSupabaseError(error));
    }

    // Extract unique tags from all posts
    const allTags = data?.flatMap((p) => p.tags || []) || [];
    const uniqueTags = [...new Set(allTags)].sort();

    return successResponse(uniqueTags);
  } catch (error) {
    console.error("Get post tags error:", error);
    return errorResponse("Failed to fetch tags");
  }
}
