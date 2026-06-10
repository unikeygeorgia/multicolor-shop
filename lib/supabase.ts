import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both env vars are present; the app falls back to seed data otherwise. */
export const isSupabaseConfigured = Boolean(url && key);

/** Browser Supabase client (anon/publishable key). Null when unconfigured. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string)
  : null;
