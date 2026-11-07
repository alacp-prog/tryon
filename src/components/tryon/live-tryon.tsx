import * as ImagePicker from 'expo-image-picker';
import { PoseCameraView, type InferenceError, type PoseFrame } from 'expo-mediapipe-pose';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GarmentOverlay } from '@/components/tryon/garment-overlay';
import { Button } from '@/components/ui/button';
import { ScreenState } from '@/components/ui/screen-state';
import { Spacing } from '@/constants/theme';
import {
  fitGarmentToShoulders,
  smoothShoulders,
  type GarmentPlacement,
  type ShoulderPair,
} from '@/features/tryon/garment-fit';
import { shouldersInView, type Size } from '@/features/tryon/pose-shoulders';
import type { TryOnImage } from '@/types/product';

interface LiveTryOnProps {
  garment: TryOnImage;
}

/** Weight of the newest frame in the shoulder smoothing (US07). */
const SMOOTHING_ALPHA = 0.45;
/** Hide the garment if no shoulders were seen for this long. */
const LOST_TRACKING_MS = 600;

type Permission = 'pending' | 'granted' | 'denied';

const ERROR_MESSAGES: Partial<Record<InferenceError['code'], string>> = {
  cameraPermission: 'Accès à la caméra refusé.',
  cameraConfiguration: 'Cette caméra n’est pas prise en charge.',
  modelInitialization: 'Le modèle de détection n’a pas pu démarrer.',
};

/** US07 : le vêtement suit les mouvements du client en temps réel. */
export function LiveTryOn({ garment }: LiveTryOnProps) {
  const [permission, setPermission] = useState<Permission>('pending');
  const [isFocused, setIsFocused] = useState(true);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [placement, setPlacement] = useState<GarmentPlacement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState(0);

  const viewSize = useRef<Size>({ width: 0, height: 0 });
  const smoothed = useRef<ShoulderPair | null>(null);
  const lastSeenAt = useRef(0);

  useEffect(() => {
    ImagePicker.requestCameraPermissionsAsync().then(({ status }) =>
      setPermission(status === 'granted' ? 'granted' : 'denied')
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    viewSize.current = { width, height };
  };

  const onLandmark = (frame: PoseFrame) => {
    const imageSize = { width: frame.additionalData.width, height: frame.additionalData.height };
    const shoulders = shouldersInView(frame, imageSize, viewSize.current);
    const now = Date.now();

    if (!shoulders) {
      if (now - lastSeenAt.current > LOST_TRACKING_MS) {
        smoothed.current = null;
        setPlacement(null);
      }
      return;
    }

    lastSeenAt.current = now;
    smoothed.current = smoothShoulders(smoothed.current, shoulders, SMOOTHING_ALPHA);
    setPlacement(
      fitGarmentToShoulders(smoothed.current, {
        width: garment.imageWidth,
        height: garment.imageHeight,
        leftShoulder: garment.leftShoulder,
        rightShoulder: garment.rightShoulder,
      })
    );
  };

  const resetTracking = () => {
    smoothed.current = null;
    setPlacement(null);
  };

  if (permission === 'pending') {
    return <ScreenState kind="loading" message="Demande d’accès à la caméra…" />;
  }
  if (permission === 'denied') {
    return (
      <ScreenState
        kind="error"
        message="L’essayage en direct a besoin de la caméra. Autorisez-la dans les réglages du téléphone."
      />
    );
  }
  if (error) {
    return (
      <ScreenState
        kind="error"
        message={error}
        actionLabel="Réessayer"
        onAction={() => {
          setError(null);
          resetTracking();
          setCameraKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.camera} onLayout={onLayout}>
        <PoseCameraView
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          isActive={isFocused}
          cameraFacing={facing}
          skeleton={false}
          frameLimit={30}
          callbackFps={30}
          onLandmark={onLandmark}
          onCameraConfigured={resetTracking}
          onInferenceError={(failure) =>
            setError(ERROR_MESSAGES[failure.code] ?? 'La caméra s’est arrêtée de façon inattendue.')
          }
        />
        {placement ? <GarmentOverlay imageUrl={garment.imageUrl} placement={placement} /> : null}
        {!placement ? (
          <View style={styles.hintBox}>
            <ThemedText type="smallBold" style={styles.hintText}>
              Reculez et placez-vous face à la caméra, épaules visibles.
            </ThemedText>
          </View>
        ) : null}
      </View>
      <Button
        label={facing === 'front' ? 'Caméra arrière' : 'Caméra avant'}
        variant="secondary"
        onPress={() => setFacing((value) => (value === 'front' ? 'back' : 'front'))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  camera: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  hintBox: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    padding: Spacing.two,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hintText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
