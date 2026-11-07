import { requireOptionalNativeModule } from 'expo';

/** Native modules this app needs; they only exist in a binary built after they were installed. */
export const NATIVE_MODULES = {
  sqlite: 'ExpoSQLite',
  imagePicker: 'ExponentImagePicker',
  pose: 'ExpoMediaPipePose',
} as const;

export type NativeModuleKey = keyof typeof NATIVE_MODULES;

export function isNativeModuleAvailable(key: NativeModuleKey): boolean {
  return requireOptionalNativeModule(NATIVE_MODULES[key]) != null;
}

export const OUTDATED_BUILD_MESSAGE =
  'Cette version de l’application ne contient pas tous les modules natifs. Installez le dernier build de développement (EAS) puis relancez.';
