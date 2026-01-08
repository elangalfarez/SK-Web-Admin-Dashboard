// src/lib/supabase/storage.ts
// Created: Supabase Storage helpers for file uploads (images, documents)

import { createClient } from "./client";
import { STORAGE_BUCKETS, UPLOAD } from "@/lib/constants";

// ============================================================================
// TYPES
// ============================================================================

export type StorageBucket = keyof typeof STORAGE_BUCKETS;

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to Supabase Storage
 * 
 * @param file - The file to upload
 * @param options - Upload configuration
 * @returns Upload result with public URL
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder = "", fileName, upsert = false } = options;
  
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = createClient();
    const bucketName = STORAGE_BUCKETS[bucket];

    // Generate unique file name if not provided
    const finalFileName = fileName || generateFileName(file);
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload an image with automatic resizing/optimization
 * Uses the same upload function but validates as image
 */
export async function uploadImage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate as image
  if (!UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_IMAGE_TYPES[number])) {
    return {
      success: false,
      error: `Invalid image type. Accepted: ${UPLOAD.ACCEPTED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (file.size > UPLOAD.MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `Image too large. Maximum size: ${UPLOAD.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    };
  }

  return uploadFile(file, options);
}

/**
 * Upload multiple images at once
 */
export async function uploadImages(
  files: File[],
  options: Omit<UploadOptions, "fileName">
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadImage(file, options)));
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a file from storage
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const bucketName = STORAGE_BUCKETS[bucket];

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(
  bucket: StorageBucket,
  paths: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const bucketName = STORAGE_BUCKETS[bucket];

    const { error } = await supabase.storage
      .from(bucketName)
      .remove(paths);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete file by its public URL
 */
export async function deleteFileByUrl(
  bucket: StorageBucket,
  url: string
): Promise<{ success: boolean; error?: string }> {
  const path = extractPathFromUrl(url, bucket);
  if (!path) {
    return { success: false, error: "Invalid URL" };
  }
  return deleteFile(bucket, path);
}

// ============================================================================
// URL FUNCTIONS
// ============================================================================

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const bucketName = STORAGE_BUCKETS[bucket];
  
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Get signed URL for temporary access (useful for private files)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = createClient();
    const bucketName = STORAGE_BUCKETS[bucket];

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Signed URL error:", error);
    return null;
  }
}

/**
 * Extract file path from public URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const bucketName = STORAGE_BUCKETS[bucket];
    const regex = new RegExp(`/storage/v1/object/public/${bucketName}/(.+)$`);
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate file before upload
 */
function validateFile(file: File): string | null {
  if (!file) {
    return "No file provided";
  }

  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    return `File too large. Maximum size: ${UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  const isImage = UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_IMAGE_TYPES[number]);
  const isDocument = UPLOAD.ACCEPTED_DOCUMENT_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_DOCUMENT_TYPES[number]);

  if (!isImage && !isDocument) {
    return "Invalid file type";
  }

  return null;
}

/**
 * Generate unique file name with timestamp
 */
function generateFileName(file: File): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop() || "png";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9]/g, "-") // Replace special chars
    .substring(0, 30); // Limit length
  
  return `${cleanName}-${timestamp}-${random}.${extension}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_IMAGE_TYPES[number]);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// LIST FUNCTIONS
// ============================================================================

/**
 * List files in a bucket folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder: string = ""
): Promise<{ name: string; url: string }[]> {
  try {
    const supabase = createClient();
    const bucketName = STORAGE_BUCKETS[bucket];

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("List files error:", error);
      return [];
    }

    return (data || [])
      .filter((item) => item.name !== ".emptyFolderPlaceholder")
      .map((item) => ({
        name: item.name,
        url: getPublicUrl(bucket, folder ? `${folder}/${item.name}` : item.name),
      }));
  } catch (error) {
    console.error("List files error:", error);
    return [];
  }
}
