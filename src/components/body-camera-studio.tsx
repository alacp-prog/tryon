import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BodyProcessor } from '@/components/body-processor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiKey, setApiKey } from '@/services/body-segmenter';
import {
  PickedImage,
  pickPhotoFromGallery,
  shareImage,
  takePhotoWithCamera,
} from '@/services/image-picker-service';
import { DetectionResult } from '@/types/body-detection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH * 1.33);

// A sample full-body model photo for instant testing
const SAMPLE_MODEL_URI =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=80';

export function BodyCameraStudio() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [currentImage, setCurrentImage] = useState<PickedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [viewMode, setViewMode] = useState<'processed' | 'original'>('processed');
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#FFFFFF');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // API Key Settings Modal
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(getApiKey());
  const [hasApiKey, setHasApiKey] = useState<boolean>(Boolean(getApiKey()));

  const handleCapturePhoto = async () => {
    try {
      setStatusMessage('Ouverture de la caméra...');
      const picked = await takePhotoWithCamera();
      if (picked) {
        setCurrentImage(picked);
        setDetectionResult(null);
        setIsProcessing(true);
        setStatusMessage('Détection du corps et détourage en cours...');
      } else {
        setStatusMessage('');
      }
    } catch (err: unknown) {
      Alert.alert('Erreur Caméra', String(err));
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handlePickGallery = async () => {
    try {
      setStatusMessage('Sélection dans la galerie...');
      const picked = await pickPhotoFromGallery();
      if (picked) {
        setCurrentImage(picked);
        setDetectionResult(null);
        setIsProcessing(true);
        setStatusMessage('Détection du corps et détourage en cours...');
      } else {
        setStatusMessage('');
      }
    } catch (err: unknown) {
      Alert.alert('Erreur Galerie', String(err));
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleLoadDemo = () => {
    setCurrentImage({
      uri: SAMPLE_MODEL_URI,
      base64: SAMPLE_MODEL_URI,
      width: 720,
      height: 960,
    });
    setDetectionResult(null);
    setIsProcessing(true);
    setStatusMessage('Détection du corps sur le mannequin...');
  };

  const handleProcessorResult = (result: DetectionResult) => {
    setDetectionResult(result);
    setIsProcessing(false);
    setViewMode('processed');
    setStatusMessage(
      result.hasBody
        ? `Corps détecté avec succès ! (${result.coverage}% de l'image)`
        : 'Photo traitée avec fond blanc.'
    );
  };

  const handleProcessorError = (error: string) => {
    setIsProcessing(false);
    setStatusMessage('');
    Alert.alert('Information Traitement', error);
  };

  const handleShare = async () => {
    if (!detectionResult?.processedUri) return;
    try {
      await shareImage(detectionResult.processedUri);
    } catch (err) {
      Alert.alert('Erreur de partage', String(err));
    }
  };

  const handleReset = () => {
    setCurrentImage(null);
    setDetectionResult(null);
    setIsProcessing(false);
    setStatusMessage('');
  };

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    setHasApiKey(Boolean(tempApiKey.trim()));
    setShowKeyModal(false);
    Alert.alert(
      'Paramètres enregistrés',
      tempApiKey.trim()
        ? 'Clé API enregistrée ! Le détourage IA HD est activé.'
        : 'Clé effacée. Mode local actif.'
    );
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Processor */}
      <BodyProcessor
        imageUri={currentImage?.uri || null}
        imageBase64={currentImage?.base64 || currentImage?.uri || null}
        backgroundColor={selectedBgColor}
        isProcessing={isProcessing}
        onResult={handleProcessorResult}
        onError={handleProcessorError}
      />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Studio Détection Corps
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Prenez une photo : l&apos;application d&eacute;tecte automatiquement votre corps et remplace
          l&apos;arri&egrave;re-plan par un fond blanc studio pour le virtual try-on.
        </ThemedText>

        {/* API Key / Engine Badge */}
        <Pressable
          style={styles.engineBadge}
          onPress={() => setShowKeyModal(true)}>
          <Text style={styles.engineBadgeText}>
            {hasApiKey ? '✨ IA Cloud Connectée' : '⚡ Mode Mobile Local'} (Modifier)
          </Text>
        </Pressable>
      </View>

      {/* Main Card */}
      {!currentImage ? (
        <ThemedView type="backgroundElement" style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.cameraBigIcon}>📸</Text>
          </View>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Prêt pour la capture
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyDesc}>
            Cadrez votre corps en entier ou à mi-corps face à la caméra.
          </ThemedText>

          <View style={styles.actionButtonsCol}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleCapturePhoto}>
              <Text style={styles.primaryButtonText}>📷 Prendre une Photo (Caméra)</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handlePickGallery}>
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                🖼️ Choisir depuis la Galerie
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.demoButton, pressed && styles.buttonPressed]}
              onPress={handleLoadDemo}>
              <Text style={styles.demoButtonText}>⚡ Tester avec une photo démo</Text>
            </Pressable>
          </View>
        </ThemedView>
      ) : (
        <View style={styles.previewSection}>
          {/* Status Banner */}
          {statusMessage ? (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: detectionResult?.hasBody
                    ? '#10B98120'
                    : '#3B82F620',
                  borderColor: detectionResult?.hasBody ? '#10B981' : '#3B82F6',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: detectionResult?.hasBody ? '#059669' : '#2563EB' },
                ]}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {/* Toggle View Mode (Fond Blanc vs Originale) */}
          {detectionResult ? (
            <View style={styles.tabToggleRow}>
              <Pressable
                style={[
                  styles.toggleTab,
                  viewMode === 'processed' && styles.toggleTabActive,
                ]}
                onPress={() => setViewMode('processed')}>
                <Text
                  style={[
                    styles.toggleTabText,
                    viewMode === 'processed' && styles.toggleTabTextActive,
                  ]}>
                  ✨ Fond Blanc (Corps Détecté)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toggleTab,
                  viewMode === 'original' && styles.toggleTabActive,
                ]}
                onPress={() => setViewMode('original')}>
                <Text
                  style={[
                    styles.toggleTabText,
                    viewMode === 'original' && styles.toggleTabTextActive,
                  ]}>
                  📷 Photo Originale
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Image Display Frame */}
          <View style={styles.previewCard}>
            <View
              style={[
                styles.imageContainer,
                {
                  width: PREVIEW_WIDTH,
                  height: PREVIEW_HEIGHT,
                  backgroundColor:
                    viewMode === 'processed' ? selectedBgColor : '#000000',
                },
              ]}>
              {isProcessing ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <ThemedText style={styles.loadingText}>
                    Détection du corps en cours...
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Isolation de la silhouette & fond blanc studio
                  </ThemedText>
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri:
                        viewMode === 'processed' && detectionResult
                          ? detectionResult.processedUri
                          : currentImage.uri,
                    }}
                    style={styles.image}
                    contentFit="contain"
                    transition={300}
                  />

                  {/* Bounding Box Visualizer */}
                  {viewMode === 'processed' &&
                    showBoundingBox &&
                    detectionResult?.bbox && (
                      <View
                        style={[
                          styles.boundingBox,
                          {
                            left: `${detectionResult.bbox.x}%`,
                            top: `${detectionResult.bbox.y}%`,
                            width: `${detectionResult.bbox.width}%`,
                            height: `${detectionResult.bbox.height}%`,
                          },
                        ]}>
                        <View style={styles.bboxTag}>
                          <Text style={styles.bboxTagText}>
                            Corps ({detectionResult.coverage}%)
                          </Text>
                        </View>
                      </View>
                    )}
                </>
              )}
            </View>

            {/* Metrics Info Bar */}
            {detectionResult && (
              <View style={styles.metricsBar}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Statut</Text>
                  <Text style={styles.metricValue}>
                    {detectionResult.hasBody ? '✓ Corps détecté' : '✓ Traité'}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Couverture</Text>
                  <Text style={styles.metricValue}>{detectionResult.coverage}%</Text>
                </View>
                {detectionResult.processingTimeMs ? (
                  <>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Temps</Text>
                      <Text style={styles.metricValue}>
                        {(detectionResult.processingTimeMs / 1000).toFixed(1)}s
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            )}
          </View>

          {/* Options & Background Colors */}
          {detectionResult && (
            <View style={styles.optionsSection}>
              <View style={styles.optionsRow}>
                <ThemedText type="smallBold">Couleur de fond :</ThemedText>
                <View style={styles.colorPills}>
                  {[
                    { label: 'Blanc', value: '#FFFFFF', border: '#D1D5DB' },
                    { label: 'Gris clair', value: '#F3F4F6', border: '#D1D5DB' },
                    { label: 'Crème', value: '#FAF9F6', border: '#D1D5DB' },
                  ].map((color) => (
                    <Pressable
                      key={color.value}
                      onPress={() => {
                        setSelectedBgColor(color.value);
                        setIsProcessing(true);
                      }}
                      style={[
                        styles.colorPill,
                        { backgroundColor: color.value, borderColor: color.border },
                        selectedBgColor === color.value && styles.colorPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.colorPillText,
                          {
                            color: color.value === '#FFFFFF' ? '#111827' : '#374151',
                          },
                        ]}>
                        {color.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={styles.toggleBboxButton}
                onPress={() => setShowBoundingBox(!showBoundingBox)}>
                <ThemedText type="small">
                  {showBoundingBox ? '☑ Masquer le cadre de détection' : '☐ Afficher le cadre de détection'}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* Actions Bottom Buttons */}
          <View style={styles.bottomActions}>
            {detectionResult && (
              <Pressable
                style={({ pressed }) => [styles.shareButton, pressed && styles.buttonPressed]}
                onPress={handleShare}>
                <Text style={styles.shareButtonText}>📤 Enregistrer / Partager</Text>
              </Pressable>
            )}

            <View style={styles.retakeRow}>
              <Pressable
                style={({ pressed }) => [styles.retakeButton, pressed && styles.buttonPressed]}
                onPress={handleCapturePhoto}>
                <Text style={styles.retakeButtonText}>📸 Reprendre photo</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
                onPress={handleReset}>
                <Text style={styles.resetButtonText}>✕ Réinitialiser</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* API Key Modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView type="backgroundElement" style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Configuration IA Détourage
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalDesc}>
              Pour un d&eacute;tourage IA ultra-net (silhouette, cheveux, v&ecirc;tements) directement
              sur mobile, vous pouvez renseigner une cl&eacute; API gratuite de remove.bg (50 cr&eacute;dits gratuits/mois).
              Sans cl&eacute;, le mode mobile local est appliqu&eacute;.
            </ThemedText>

            <TextInput
              style={styles.keyInput}
              placeholder="Collez votre clé API Remove.bg ici"
              placeholderTextColor="#9CA3AF"
              value={tempApiKey}
              onChangeText={setTempApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowKeyModal(false)}>
                <Text style={styles.modalCancelBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}>
                <Text style={styles.modalSaveBtnText}>Enregistrer</Text>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.four,
    alignItems: 'center',
    paddingBottom: Spacing.six,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
    maxWidth: 480,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  engineBadge: {
    marginTop: Spacing.two,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#3B82F615',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F640',
  },
  engineBadgeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F615',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cameraBigIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  actionButtonsCol: {
    width: '100%',
    gap: Spacing.three,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  demoButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  previewSection: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
  },
  statusBanner: {
    width: PREVIEW_WIDTH,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
    width: PREVIEW_WIDTH,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTabTextActive: {
    color: '#111827',
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  bboxTag: {
    position: 'absolute',
    top: -22,
    left: 0,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    width: PREVIEW_WIDTH,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  metricDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  optionsSection: {
    width: PREVIEW_WIDTH,
    gap: Spacing.two,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorPills: {
    flexDirection: 'row',
    gap: 8,
  },
  colorPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorPillActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  colorPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toggleBboxButton: {
    paddingVertical: 4,
  },
  bottomActions: {
    width: PREVIEW_WIDTH,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  shareButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  retakeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  keyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
