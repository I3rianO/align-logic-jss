// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  const missing =
    !url && !anonKey
      ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
      : !url
      ? 'VITE_SUPABASE_URL'
      : 'VITE_SUPABASE_ANON_KEY'
  throw new Error(
    `[Supabase] Missing env var: ${missing}. Set these in Vercel → Project → Settings → Environment Variables.`
  )
}

// Create a single supabase client for the whole app
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
