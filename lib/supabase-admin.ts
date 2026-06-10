import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS — never
 * import this into client components. Used by route handlers (e.g. /api/orders)
 * to create accounts and write user-linked orders.
 *
 * Requires env vars (set in .env.local and in Vercel, NOT committed):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(url && serviceKey);

export function getAdminClient(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
