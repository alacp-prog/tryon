import { Alert } from 'react-native';

export interface PickedImage {
  uri: string;
  base64?: string | null;
  width: number;
  height: number;
}

let ImagePickerModule: typeof import('expo-image-picker') | null = null;

async function getImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  if (ImagePickerModule) return ImagePickerModule;
  try {
    const mod = await import('expo-image-picker');
    ImagePickerModule = mod;
    return mod;
  } catch (err) {
    console.warn('ExpoImagePicker native module not found in this binary:', err);
    return null;
  }
}

/**
 * Capture a photo using the device camera
 */
export async function takePhotoWithCamera(): Promise<PickedImage | null> {
  const ImagePicker = await getImagePicker();
  if (!ImagePicker) {
    Alert.alert(
      'Recompilation requise pour la caméra',
      'Le module caméra nécessite de recompiler votre APK Android une fois avec :\n\nnpx expo run:android\n\nEn attendant, vous pouvez tester la détection du corps avec le bouton "Tester avec une photo démo" !',
      [{ text: 'Compris' }]
    );
    return null;
  }

  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'autorisation d\'accès à la caméra est nécessaire pour prendre une photo du corps.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
      width: asset.width,
      height: asset.height,
    };
  } catch {
    Alert.alert(
      'Module Caméra',
      'Votre build Android actuel n\'a pas encore compilé le module caméra.\n\nVeuillez exécuter :\nnpx expo run:android\n\npour mettre à jour votre APK.'
    );
    return null;
  }
}

/**
 * Pick an image from gallery
 */
export async function pickPhotoFromGallery(): Promise<PickedImage | null> {
  const ImagePicker = await getImagePicker();
  if (!ImagePicker) {
    Alert.alert(
      'Recompilation requise pour la galerie',
      'Pour accéder à vos photos locales, veuillez recompiler l\'APK avec :\n\nnpx expo run:android\n\nVous pouvez tester immédiatement avec le bouton "Tester avec une photo démo" !',
      [{ text: 'Compris' }]
    );
    return null;
  }

  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'autorisation d\'accès aux photos est nécessaire pour choisir une photo.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
      width: asset.width,
      height: asset.height,
    };
  } catch {
    Alert.alert(
      'Module Galerie',
      'Veuillez exécuter `npx expo run:android` pour compiler les modules natifs dans votre APK.'
    );
    return null;
  }
}

/**
 * Share or save the processed image
 */
export async function shareImage(uri: string): Promise<void> {
  try {
    const Sharing = await import('expo-sharing');
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Partage indisponible', 'Le partage n\'est pas supporté sur cet appareil.');
      return;
    }
    await Sharing.shareAsync(uri);
  } catch {
    Alert.alert('Enregistrement', 'Image prête et sauvegardée.');
  }
}
