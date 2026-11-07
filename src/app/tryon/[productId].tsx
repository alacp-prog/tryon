import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ScreenState } from '@/components/ui/screen-state';
import { Spacing } from '@/constants/theme';
import { isNativeModuleAvailable, OUTDATED_BUILD_MESSAGE } from '@/lib/native-modules';
import { getProduct } from '@/services/products';
import type { Product } from '@/types/product';

type Mode = 'live' | 'photo';

const canTryOn = isNativeModuleAvailable('pose') && isNativeModuleAvailable('imagePicker');

// The camera components load native views at import time: only require them when present.
/* eslint-disable @typescript-eslint/no-require-imports */
const { LiveTryOn } = canTryOn
  ? (require('@/components/tryon/live-tryon') as typeof import('@/components/tryon/live-tryon'))
  : { LiveTryOn: null };
const { PhotoTryOn } = canTryOn
  ? (require('@/components/tryon/photo-tryon') as typeof import('@/components/tryon/photo-tryon'))
  : { PhotoTryOn: null };
/* eslint-enable @typescript-eslint/no-require-imports */

/** US06 + US07 : écran d'essayage, en direct ou sur photo. */
export default function TryOnScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('live');

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    getProduct(productId)
      .then((loaded) => isMounted && setProduct(loaded))
      .catch((err: unknown) => isMounted && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const renderBody = () => {
    if (!LiveTryOn || !PhotoTryOn) {
      const message =
        Platform.OS === 'web'
          ? 'L’essayage virtuel est disponible uniquement dans l’application mobile.'
          : OUTDATED_BUILD_MESSAGE;
      return <ScreenState kind="error" message={message} />;
    }
    if (error) return <ScreenState kind="error" message={error} />;
    if (!product) return <ScreenState kind="loading" message="Chargement du vêtement…" />;
    if (!product.tryOnImage) {
      return <ScreenState kind="empty" message="Ce vêtement n’est pas encore essayable." />;
    }
    return (
      <View style={styles.body}>
        <View style={styles.modes}>
          <Button
            label="En direct"
            variant={mode === 'live' ? 'primary' : 'secondary'}
            onPress={() => setMode('live')}
            style={styles.mode}
          />
          <Button
            label="Sur une photo"
            variant={mode === 'photo' ? 'primary' : 'secondary'}
            onPress={() => setMode('photo')}
            style={styles.mode}
          />
        </View>
        {mode === 'live' ? (
          <LiveTryOn garment={product.tryOnImage} />
        ) : (
          <PhotoTryOn garment={product.tryOnImage} />
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: product?.name ?? 'Essayage virtuel' }} />
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        {renderBody()}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  modes: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mode: {
    flex: 1,
  },
});
