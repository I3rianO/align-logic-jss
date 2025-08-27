// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

/**
 * KIOSK MODE SUPABASE CLIENT
 *
 * - persistSession: false  → no localStorage; session dies on refresh/close
 * - autoRefreshToken: false → no background refresh (keeps sessions short-lived)
 * - detectSessionInUrl: true → allows magic link or reset flows if needed
 *
 * Ensure these env vars exist in your Vite project:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // This helps catch misconfigured environments at build/runtime.
  // You can remove this throw if you prefer silent failure.
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,     // 🚫 never keep sessions in storage
    autoRefreshToken: false,   // 🚫 do not refresh automatically
    detectSessionInUrl: true,  // ✅ still allow URL-based flows if needed
  },
});

/** Optional convenience helpers (you can use or remove) */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export async function signOutKiosk() {
  // Clears in-memory session; pair with a hard redirect afterwards if desired.
  await supabase.auth.signOut();
}
