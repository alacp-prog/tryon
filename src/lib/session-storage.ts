import type { SupportedStorage } from '@supabase/supabase-js';

import { isNativeModuleAvailable } from '@/lib/native-modules';

/** Session kept in memory only: used when the binary has no ExpoSQLite (session lost on restart). */
export function createMemoryStorage(): SupportedStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

/** Native: persists the Supabase session with expo-sqlite's localStorage polyfill. */
export function createSessionStorage(): SupportedStorage {
  if (!isNativeModuleAvailable('sqlite')) {
    console.warn('ExpoSQLite absent de ce binaire : la session ne sera pas conservée.');
    return createMemoryStorage();
  }
  // Loaded lazily: importing it in a binary without ExpoSQLite crashes the whole app.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-sqlite/localStorage/install');
  return globalThis.localStorage;
}
