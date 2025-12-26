// src/lib/supabase/index.ts
// Created: Barrel export for Supabase utilities

// Client exports
export { createClient, getBrowserClient } from "./client";

// Server exports
export {
  createClient as createServerClient,
  createAdminClient,
  createRouteHandlerClient,
} from "./server";

// Auth exports
export {
  signInWithPassword,
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getAuthUserById,
  getAdminUserByEmail,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  isSuperAdmin,
  logActivity,
  hashPassword,
  updateLastLogin,
} from "./auth";

// Storage exports
export {
  uploadFile,
  uploadImage,
  uploadImages,
  deleteFile,
  deleteFiles,
  deleteFileByUrl,
  getPublicUrl,
  getSignedUrl,
  extractPathFromUrl,
  listFiles,
  isImageFile,
  formatFileSize,
  getFileExtension,
  type StorageBucket,
  type UploadResult,
  type UploadOptions,
} from "./storage";

// Middleware exports
export {
  createMiddlewareClient,
  isProtectedRoute,
  isAuthRoute,
  isPublicRoute,
  getRedirectUrl,
} from "./middleware";
