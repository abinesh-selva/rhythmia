import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if we have valid, non-placeholder keys
export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-supabase-anon-key";

// Standard Supabase client (only created if configured, otherwise falls back gracefully)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "Soniqo: Supabase environment variables are missing or placeholders. Falling back to robust LocalStorage offline database mode."
  );
}
