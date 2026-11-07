import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Danger, Spacing } from '@/constants/theme';
import { pickImageFile, type PickedFile } from '@/services/admin-image-picker';
import { createProduct } from '@/services/products';
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  firstIssueMessage,
  productFormSchema,
  type ProductCategory,
} from '@/types/product';

/** US12 : le responsable ajoute un produit au catalogue. */
export default function NewProductScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [image, setImage] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chooseImage = async () => {
    try {
      const picked = await pickImageFile();
      if (picked) setImage(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const submit = async () => {
    const parsed = productFormSchema.safeParse({ name, description, price, category });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await createProduct(
        parsed.data,
        image ? { uri: image.uri, mimeType: image.mimeType } : null
      );
      Alert.alert('Produit ajouté', 'Ajoutez maintenant son image d’essayage.', [
        {
          text: 'Plus tard',
          style: 'cancel',
          onPress: () => router.back(),
        },
        {
          text: 'Continuer',
          onPress: () =>
            router.replace({
              pathname: '/admin/products/[id]/tryon-image',
              params: { id: created.id },
            }),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La création a échoué.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormField label="Nom" value={name} onChangeText={setName} maxLength={120} />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            style={styles.multiline}
          />
          <FormField
            label="Prix (TND)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <ThemedText type="smallBold">Catégorie</ThemedText>
          <View style={styles.categories}>
            {PRODUCT_CATEGORIES.map((value) => (
              <Button
                key={value}
                label={CATEGORY_LABELS[value]}
                variant={category === value ? 'primary' : 'secondary'}
                onPress={() => setCategory(value)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">Photo catalogue</ThemedText>
          {image ? <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" /> : null}
          <Button
            label={image ? 'Changer la photo' : 'Choisir une photo'}
            variant="secondary"
            onPress={chooseImage}
          />

          {error ? (
            <ThemedText type="small" style={{ color: Danger }} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}
          <Button label="Enregistrer le produit" onPress={submit} loading={isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  preview: {
    width: 160,
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
});
