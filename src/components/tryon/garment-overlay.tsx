import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { GarmentPlacement } from '@/features/tryon/garment-fit';

interface GarmentOverlayProps {
  imageUrl: string;
  placement: GarmentPlacement;
}

/** Draws the transparent garment PNG at the computed position over the body. */
export function GarmentOverlay({ imageUrl, placement }: GarmentOverlayProps) {
  return (
    <Image
      source={{ uri: imageUrl }}
      contentFit="fill"
      pointerEvents="none"
      accessibilityLabel="Vêtement essayé"
      style={[
        styles.garment,
        {
          left: placement.left,
          top: placement.top,
          width: placement.width,
          height: placement.height,
          transformOrigin: [placement.originX, placement.originY, 0],
          transform: [{ rotate: `${placement.rotationDeg}deg` }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  garment: {
    position: 'absolute',
  },
});
