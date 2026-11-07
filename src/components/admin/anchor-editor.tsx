import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Accent, Danger, Spacing } from '@/constants/theme';
import {
  containRect,
  imagePointToView,
  viewPointToImage,
  type Size,
} from '@/features/tryon/image-geometry';
import type { NormalizedPoint } from '@/types/product';

export interface Anchors {
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
}

export const DEFAULT_ANCHORS: Anchors = {
  leftShoulder: { x: 0.3, y: 0.2 },
  rightShoulder: { x: 0.7, y: 0.2 },
};

type AnchorKey = keyof Anchors;

interface AnchorEditorProps {
  imageUri: string;
  imageSize: Size;
  anchors: Anchors;
  onChange: (anchors: Anchors) => void;
}

const MARKER_SIZE = 28;

/** Lets the manager tap where the garment's shoulders are (US18). */
export function AnchorEditor({ imageUri, imageSize, anchors, onChange }: AnchorEditorProps) {
  const [active, setActive] = useState<AnchorKey>('leftShoulder');
  const [viewSize, setViewSize] = useState<Size>({ width: 0, height: 0 });
  const rect = containRect(imageSize, viewSize);

  const onPress = (event: GestureResponderEvent) => {
    const point = viewPointToImage(
      { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
      rect
    );
    if (!point) return;
    onChange({ ...anchors, [active]: point });
    setActive(active === 'leftShoulder' ? 'rightShoulder' : 'leftShoulder');
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Touchez l’image pour placer l’épaule{' '}
        {active === 'leftShoulder' ? 'gauche (à gauche de l’écran)' : 'droite (à droite de l’écran)'}.
      </ThemedText>
      <Pressable
        accessibilityLabel="Image d’essayage, touchez pour placer un point d’épaule"
        onPress={onPress}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setViewSize({ width, height });
        }}
        style={styles.canvas}>
        <Image
          source={{ uri: imageUri }}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {(Object.keys(anchors) as AnchorKey[]).map((key) => {
          const position = imagePointToView(anchors[key], rect);
          return (
            <View
              key={key}
              pointerEvents="none"
              style={[
                styles.marker,
                {
                  left: position.x - MARKER_SIZE / 2,
                  top: position.y - MARKER_SIZE / 2,
                  borderColor: key === active ? Danger : Accent,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.markerText}>
                {key === 'leftShoulder' ? 'G' : 'D'}
              </ThemedText>
            </View>
          );
        })}
      </Pressable>
      <View style={styles.row}>
        <Button
          label="Épaule gauche"
          variant={active === 'leftShoulder' ? 'primary' : 'secondary'}
          onPress={() => setActive('leftShoulder')}
          style={styles.flex}
        />
        <Button
          label="Épaule droite"
          variant={active === 'rightShoulder' ? 'primary' : 'secondary'}
          onPress={() => setActive('rightShoulder')}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  canvas: {
    height: 360,
    borderRadius: 12,
    overflow: 'hidden',
    // Checkerboard-like neutral background so transparency is visible.
    backgroundColor: '#D9DCE1',
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    color: '#000000',
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
