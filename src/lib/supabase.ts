import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-supabase-anon-key";

// @supabase/auth-js calls console.error(e) in _handleRequest before wrapping a thrown
// fetch error into AuthRetryableFetchError. By converting thrown network failures into a
// 503 HTTP response, auth-js reaches handleError() instead — which recognises 503 as a
// NETWORK_ERROR_CODE and throws AuthRetryableFetchError silently (no console.error).
// postgrest-js also treats 503 as retryable and handles it without logging.
const safeFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch {
    return new Response(JSON.stringify({ message: "Network unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });
  }
};

const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;

  const globalVar = globalThis as { supabaseClient?: SupabaseClient };
  if (!globalVar.supabaseClient) {
    globalVar.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: safeFetch },
    });
  }
  return globalVar.supabaseClient;
};

export const supabase = getSupabaseClient();
