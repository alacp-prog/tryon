import { Image } from 'expo-image';
import { analyzePoseImage, type PoseDetection } from 'expo-mediapipe-pose';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GarmentOverlay } from '@/components/tryon/garment-overlay';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { fitGarmentToShoulders } from '@/features/tryon/garment-fit';
import { shouldersInView, type Size } from '@/features/tryon/pose-shoulders';
import { useTheme } from '@/hooks/use-theme';
import {
  pickPhotoFromGallery,
  takePhotoWithCamera,
  type PickedImage,
} from '@/services/image-picker-service';
import type { TryOnImage } from '@/types/product';

interface PhotoTryOnProps {
  garment: TryOnImage;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'analyzing' }
  | { kind: 'ready'; detection: PoseDetection }
  | { kind: 'error'; message: string };

/** US06 : essayage sur une photo fixe du client. */
export function PhotoTryOn({ garment }: PhotoTryOnProps) {
  const theme = useTheme();
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [viewSize, setViewSize] = useState<Size>({ width: 0, height: 0 });
  const [showGarment, setShowGarment] = useState(true);

  const placement = useMemo(() => {
    if (status.kind !== 'ready') return null;
    const shoulders = shouldersInView(status.detection, status.detection.imageSize, viewSize);
    if (!shoulders) return null;
    return fitGarmentToShoulders(shoulders, {
      width: garment.imageWidth,
      height: garment.imageHeight,
      leftShoulder: garment.leftShoulder,
      rightShoulder: garment.rightShoulder,
    });
  }, [status, viewSize, garment]);

  const analyze = async (picked: PickedImage | null) => {
    if (!picked) return;
    setPhoto(picked);
    setShowGarment(true);
    if (!picked.uri.startsWith('file://')) {
      setStatus({ kind: 'error', message: 'Format de photo non pris en charge sur cet appareil.' });
      return;
    }
    setStatus({ kind: 'analyzing' });
    try {
      const detection = await analyzePoseImage(picked.uri, { maxImageDimension: 1024 });
      setStatus(
        detection.landmarks.length === 0
          ? { kind: 'error', message: 'Aucune personne détectée. Prenez une photo en pied, de face.' }
          : { kind: 'ready', detection }
      );
    } catch {
      setStatus({ kind: 'error', message: 'L’analyse de la photo a échoué. Réessayez.' });
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewSize({ width, height });
  };

  const hint =
    status.kind === 'analyzing'
      ? 'Détection de votre posture…'
      : status.kind === 'error'
        ? status.message
        : status.kind === 'ready' && !placement
          ? 'Épaules non visibles : reprenez la photo de face, épaules dégagées.'
          : null;

  return (
    <View style={styles.container}>
      <View
        style={[styles.preview, { backgroundColor: theme.backgroundElement }]}
        onLayout={onLayout}>
        {photo ? (
          <Image source={{ uri: photo.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.placeholder}>
            Prenez ou choisissez une photo de vous, en pied et de face.
          </ThemedText>
        )}
        {placement && showGarment ? (
          <GarmentOverlay imageUrl={garment.imageUrl} placement={placement} />
        ) : null}
      </View>

      {hint ? (
        <ThemedText type="small" style={styles.hint}>
          {hint}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Prendre une photo"
          onPress={async () => analyze(await takePhotoWithCamera())}
          loading={status.kind === 'analyzing'}
          style={styles.action}
        />
        <Button
          label="Galerie"
          variant="secondary"
          onPress={async () => analyze(await pickPhotoFromGallery())}
          disabled={status.kind === 'analyzing'}
          style={styles.action}
        />
      </View>
      {placement ? (
        <Button
          label={showGarment ? 'Voir sans le vêtement' : 'Voir avec le vêtement'}
          variant="secondary"
          onPress={() => setShowGarment((value) => !value)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  preview: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    textAlign: 'center',
    padding: Spacing.four,
  },
  hint: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
