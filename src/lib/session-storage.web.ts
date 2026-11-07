import type { SupportedStorage } from '@supabase/supabase-js';

/** Web: the browser's localStorage (unavailable during server rendering). */
export function createSessionStorage(): SupportedStorage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
