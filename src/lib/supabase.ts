import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createSessionStorage } from '@/lib/session-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase n’est pas configuré : renseignez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env.local.';

let client: SupabaseClient | null = null;

/** Returns the shared Supabase client, or throws a readable error when env vars are missing. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: createSessionStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
