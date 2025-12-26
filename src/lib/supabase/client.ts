// src/lib/supabase/client.ts
// Created: Browser-side Supabase client for client components

import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for browser/client-side usage
 * 
 * Use this in:
 * - Client components ('use client')
 * - Real-time subscriptions
 * - Client-side data fetching (when Server Components aren't suitable)
 * 
 * Note: This client uses the anon key and respects RLS policies
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for cases where we need consistent client reference
 * Useful for real-time subscriptions to prevent multiple connections
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
