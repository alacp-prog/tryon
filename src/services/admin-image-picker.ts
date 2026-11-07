import { isNativeModuleAvailable, OUTDATED_BUILD_MESSAGE } from '@/lib/native-modules';
import { TRYON_IMAGE_RULES } from '@/types/product';

/** Loaded lazily: a top-level import crashes the route in a binary without the module. */
async function loadImagePicker(): Promise<typeof import('expo-image-picker')> {
  if (!isNativeModuleAvailable('imagePicker')) {
    throw new Error(OUTDATED_BUILD_MESSAGE);
  }
  return import('expo-image-picker');
}

export interface PickedFile {
  uri: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number | null;
}

/** Opens the gallery without cropping/re-encoding, so PNG transparency is preserved. */
export async function pickImageFile(): Promise<PickedFile | null> {
  const ImagePicker = await loadImagePicker();
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('L’accès aux photos est nécessaire pour importer une image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const isPng = asset.mimeType === 'image/png' || /\.png$/i.test(asset.fileName ?? asset.uri);
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? (isPng ? 'image/png' : 'image/jpeg'),
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? null,
  };
}

/** Demo garment bundled with the app, with its shoulder anchors already placed. */
export const DEMO_GARMENT = {
  width: 600,
  height: 700,
  anchors: {
    leftShoulder: { x: 0.275, y: 0.107 },
    rightShoulder: { x: 0.725, y: 0.107 },
  },
} as const;

export async function loadDemoGarment(): Promise<PickedFile> {
  const { Asset } = await import('expo-asset');
  const [asset] = await Asset.loadAsync(require('@/assets/demo/tshirt-tryon.png'));
  if (!asset?.localUri) throw new Error('Le t-shirt de démo n’a pas pu être chargé.');
  return {
    uri: asset.localUri,
    mimeType: 'image/png',
    width: DEMO_GARMENT.width,
    height: DEMO_GARMENT.height,
    fileSize: null,
  };
}

/** Returns an error message if the file can't be used as a try-on image (US18), else null. */
export function validateTryOnFile(file: PickedFile): string | null {
  if (file.mimeType !== 'image/png') {
    return 'L’image d’essayage doit être un PNG avec fond transparent.';
  }
  if (file.width < TRYON_IMAGE_RULES.minWidth || file.height < TRYON_IMAGE_RULES.minHeight) {
    return `Image trop petite : minimum ${TRYON_IMAGE_RULES.minWidth}×${TRYON_IMAGE_RULES.minHeight} px.`;
  }
  if (file.fileSize !== null && file.fileSize > TRYON_IMAGE_RULES.maxBytes) {
    return 'Image trop lourde : 5 Mo maximum.';
  }
  return null;
}
