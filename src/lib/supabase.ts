import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === "YOUR_SUPABASE_URL" || anonKey === "YOUR_SUPABASE_ANON_KEY") {
    console.warn(
      "⚠️ Supabase is not fully configured. Contact requests will be stored in local storage for preview purposes. To enable production database writes, please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env secrets."
    );
    return null;
  }

  try {
    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}
