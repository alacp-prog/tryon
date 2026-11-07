import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { BodyProcessor } from '@/components/body-processor';
import { ApiKeySheet } from '@/components/studio/api-key-sheet';
import { BackgroundSwatches, STUDIO_BACKGROUNDS } from '@/components/studio/background-swatches';
import { StudioEmptyState } from '@/components/studio/studio-empty-state';
import { StudioHeader } from '@/components/studio/studio-header';
import { StudioMetrics, StudioPreview } from '@/components/studio/studio-preview';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Accent, Danger, Spacing, Success } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getApiKey, setApiKey } from '@/services/body-segmenter';
import {
  pickPhotoFromGallery,
  shareImage,
  takePhotoWithCamera,
  type PickedImage,
} from '@/services/image-picker-service';
import type { DetectionResult } from '@/types/body-detection';

// Full-body model photo used by the demo button.
const SAMPLE_MODEL: PickedImage = {
  uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=80',
  base64: null,
  width: 720,
  height: 960,
};

type ViewMode = 'studio' | 'original';
const VIEW_OPTIONS = [
  { value: 'studio', label: 'Fond studio' },
  { value: 'original', label: 'Originale' },
] as const;

function aspectRatioOf(image: PickedImage): number {
  if (!image.width || !image.height) return 3 / 4;
  return Math.min(Math.max(image.width / image.height, 0.5), 1.5);
}

export function BodyCameraStudio() {
  const theme = useTheme();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('studio');
  const [showBox, setShowBox] = useState(true);
  const [bgColor, setBgColor] = useState<string>(STUDIO_BACKGROUNDS[0].value);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(Boolean(getApiKey()));

  const analyze = (picked: PickedImage | null) => {
    if (!picked) return;
    setImage(picked);
    setResult(null);
    setError(null);
    setViewMode('studio');
    setIsProcessing(true);
  };

  const onResult = useCallback((next: DetectionResult) => {
    setResult(next);
    setIsProcessing(false);
  }, []);

  const onError = useCallback((message: string) => {
    setError(message);
    setIsProcessing(false);
  }, []);

  const changeBackground = (color: string) => {
    setBgColor(color);
    setIsProcessing(true);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    setHasApiKey(Boolean(key.trim()));
    setSettingsVisible(false);
    if (image) setIsProcessing(true);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  const showStudioBackground = viewMode === 'studio' && result?.backgroundRemoved === true;
  const displayedUri = showStudioBackground && result ? result.processedUri : image?.uri;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <BodyProcessor
        imageUri={image?.uri ?? null}
        imageBase64={image?.base64 ?? null}
        backgroundColor={bgColor}
        isProcessing={isProcessing}
        onResult={onResult}
        onError={onError}
      />

      <StudioHeader hasApiKey={hasApiKey} onOpenSettings={() => setSettingsVisible(true)} />

      {!image || !displayedUri ? (
        <StudioEmptyState
          onCamera={async () => analyze(await takePhotoWithCamera())}
          onGallery={async () => analyze(await pickPhotoFromGallery())}
          onDemo={() => analyze(SAMPLE_MODEL)}
        />
      ) : (
        <View style={styles.result}>
          {result?.backgroundRemoved ? (
            <SegmentedControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
          ) : null}

          <StudioPreview
            imageUri={displayedUri}
            aspectRatio={aspectRatioOf(image)}
            backgroundColor={showStudioBackground ? bgColor : theme.backgroundElement}
            isProcessing={isProcessing}
            box={showBox ? (result?.bbox ?? null) : null}
          />

          {error ? (
            <ThemedText type="small" style={{ color: Danger }} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}

          {result && !isProcessing ? (
            <>
              {result.detectionAvailable ? (
                <ThemedText type="smallBold" style={{ color: result.hasBody ? Success : Danger }}>
                  {result.hasBody
                    ? 'Silhouette détectée'
                    : 'Aucune silhouette détectée : reprenez la photo de face, corps visible.'}
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  La détection de silhouette est disponible dans l’application mobile.
                </ThemedText>
              )}
              <StudioMetrics result={result} />
              {result.detectionAvailable ? (
                <View style={styles.switchRow}>
                  <ThemedText type="small">Afficher le cadre de détection</ThemedText>
                  <Switch
                    value={showBox}
                    onValueChange={setShowBox}
                    trackColor={{
                      true: Accent,
                      false: theme.backgroundSelected,
                    }}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {hasApiKey ? (
            <BackgroundSwatches
              value={bgColor}
              onChange={changeBackground}
              disabled={isProcessing}
            />
          ) : result && !isProcessing ? (
            <Pressable accessibilityRole="button" onPress={() => setSettingsVisible(true)}>
              <ThemedText type="small" themeColor="textSecondary">
                Fond d’origine conservé.{' '}
                <ThemedText type="smallBold" style={{ color: Accent }}>
                  Activer le fond studio IA
                </ThemedText>
              </ThemedText>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            {result && !isProcessing ? (
              <Button label="Partager l’image" onPress={() => shareImage(displayedUri)} />
            ) : null}
            <View style={styles.row}>
              <Button
                label="Nouvelle photo"
                variant="secondary"
                onPress={async () => analyze(await takePhotoWithCamera())}
                disabled={isProcessing}
                style={styles.flex}
              />
              <Button label="Effacer" variant="secondary" onPress={reset} style={styles.flex} />
            </View>
          </View>
        </View>
      )}

      {settingsVisible ? (
        <ApiKeySheet
          visible
          initialKey={getApiKey()}
          onClose={() => setSettingsVisible(false)}
          onSave={saveApiKey}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  content: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  result: {
    gap: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
