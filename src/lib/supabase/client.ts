import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "../supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const createClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
