import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing, Success } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BoundingBox, DetectionResult } from '@/types/body-detection';

interface StudioPreviewProps {
  imageUri: string;
  aspectRatio: number;
  backgroundColor: string;
  isProcessing: boolean;
  box: BoundingBox | null;
}

/** Photo frame sized to the image ratio, so the % bounding box lines up with the body. */
export function StudioPreview({
  imageUri,
  aspectRatio,
  backgroundColor,
  isProcessing,
  box,
}: StudioPreviewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.frame, { aspectRatio, backgroundColor }]}>
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        transition={250}
        accessibilityLabel="Photo analysée"
      />
      {box && !isProcessing ? (
        <View
          pointerEvents="none"
          style={[
            styles.box,
            {
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            },
          ]}>
          <View style={styles.boxTag}>
            <ThemedText type="smallBold" style={styles.boxTagText}>
              Silhouette
            </ThemedText>
          </View>
        </View>
      ) : null}
      {isProcessing ? (
        <View style={[styles.overlay, { backgroundColor: `${theme.background}D9` }]}>
          <ActivityIndicator size="large" color={Accent} />
          <ThemedText type="smallBold">Analyse de la silhouette…</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.metric, { backgroundColor: theme.backgroundElement }]}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.textSecondary} />
      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
    </View>
  );
}

export function StudioMetrics({ result }: { result: DetectionResult }) {
  return (
    <View style={styles.metrics}>
      {result.detectionAvailable ? (
        <>
          <Metric
            icon={result.hasBody ? 'check-circle-outline' : 'alert-circle-outline'}
            label="Silhouette"
            value={result.hasBody ? 'Oui' : 'Non'}
          />
          <Metric icon="crop-free" label="Surface" value={`${result.coverage} %`} />
        </>
      ) : null}
      <Metric
        icon="timer-outline"
        label="Temps"
        value={`${((result.processingTimeMs ?? 0) / 1000).toFixed(1)} s`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxHeight: 520,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Success,
    borderRadius: 8,
    backgroundColor: 'rgba(48, 164, 108, 0.08)',
  },
  boxTag: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    backgroundColor: Success,
    borderRadius: 6,
    paddingHorizontal: Spacing.one,
  },
  boxTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: 12,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
