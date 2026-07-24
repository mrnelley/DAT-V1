import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};

export const supabaseUrl = env.VITE_SUPABASE_URL || '';
export const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return supabase;
};
