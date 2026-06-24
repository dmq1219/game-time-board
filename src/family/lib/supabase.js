import { createClient } from "@supabase/supabase-js";

// Credentials come from .env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// When they are missing the app falls back to localStorage so the prototype
// still runs offline and the original game-time board is unaffected.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;
