import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AnchorEditor, DEFAULT_ANCHORS, type Anchors } from '@/components/admin/anchor-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ScreenState } from '@/components/ui/screen-state';
import { Danger, Spacing } from '@/constants/theme';
import {
  DEMO_GARMENT,
  loadDemoGarment,
  pickImageFile,
  validateTryOnFile,
  type PickedFile,
} from '@/services/admin-image-picker';
import { getProduct, saveTryOnImage } from '@/services/products';
import { anchorsSchema, firstIssueMessage, type Product } from '@/types/product';

/** US18 : le responsable importe l'image d'essayage d'un produit. */
export default function TryOnImageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [anchors, setAnchors] = useState<Anchors>(DEFAULT_ANCHORS);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((loaded) => {
        setProduct(loaded);
        if (loaded.tryOnImage) {
          setAnchors({
            leftShoulder: loaded.tryOnImage.leftShoulder,
            rightShoulder: loaded.tryOnImage.rightShoulder,
          });
        }
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  const choose = async () => {
    setError(null);
    try {
      const picked = await pickImageFile();
      if (!picked) return;
      const problem = validateTryOnFile(picked);
      if (problem) {
        setError(problem);
        return;
      }
      setFile(picked);
      setAnchors(DEFAULT_ANCHORS);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const applyDemoGarment = async () => {
    setError(null);
    try {
      setFile(await loadDemoGarment());
      setAnchors(DEMO_GARMENT.anchors);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const save = async () => {
    if (!file || !id) return;
    const parsed = anchorsSchema.safeParse(anchors);
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await saveTryOnImage({
        productId: id,
        localUri: file.uri,
        width: file.width,
        height: file.height,
        ...parsed.data,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'L’enregistrement a échoué.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadError) return <ScreenState kind="error" message={loadError} />;
  if (!product) return <ScreenState kind="loading" message="Chargement du produit…" />;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold">{product.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Importez le vêtement seul, vu de face, en PNG à fond transparent (min. 300×300 px, 5 Mo
          max). Placez ensuite les deux épaules pour qu’il s’ajuste au corps du client.
        </ThemedText>

        {product.tryOnImage && !file ? (
          <ThemedText type="small">
            Une image d’essayage existe déjà. Importez-en une nouvelle pour la remplacer.
          </ThemedText>
        ) : null}

        <Button
          label={file ? 'Changer l’image' : 'Importer le PNG'}
          variant="secondary"
          onPress={choose}
        />
        {__DEV__ ? (
          <Button label="Utiliser le t-shirt de démo" variant="secondary" onPress={applyDemoGarment} />
        ) : null}

        {file ? (
          <AnchorEditor
            imageUri={file.uri}
            imageSize={{ width: file.width, height: file.height }}
            anchors={anchors}
            onChange={setAnchors}
          />
        ) : null}

        {error ? (
          <ThemedText type="small" style={{ color: Danger }} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        <Button
          label="Enregistrer l’image d’essayage"
          onPress={save}
          disabled={!file}
          loading={isSaving}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six * 2,
  },
});
