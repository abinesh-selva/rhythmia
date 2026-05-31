import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if we have valid, non-placeholder keys
export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-supabase-anon-key";

// Prevent multiple GoTrueClient instances during HMR (Hot Module Replacement)
const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;

  const globalVar = globalThis as any;
  if (!globalVar.supabaseClient) {
    globalVar.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return globalVar.supabaseClient as SupabaseClient;
};

// Standard Supabase client (only created if configured, otherwise falls back gracefully)
export const supabase = getSupabaseClient();


