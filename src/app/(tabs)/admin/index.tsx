import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ScreenState } from '@/components/ui/screen-state';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/services/auth';
import { formatPrice } from '@/services/product-mapper';
import { listAllProductsForAdmin } from '@/services/products';
import type { Product } from '@/types/product';

export default function AdminProductsScreen() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    listAllProductsForAdmin()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  // Reload when coming back from the creation / try-on image screens.
  useFocusEffect(load);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Déconnexion', err instanceof Error ? err.message : String(err));
    }
  };

  if (error) {
    return <ScreenState kind="error" message={error} actionLabel="Réessayer" onAction={load} />;
  }
  if (!products) {
    return <ScreenState kind="loading" message="Chargement des produits…" />;
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label="Ajouter un produit" onPress={() => router.push('/admin/products/new')} />
          </View>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aucun produit. Commencez par en ajouter un.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <Image
              source={item.imageUrl ? { uri: item.imageUrl } : undefined}
              style={styles.thumb}
              contentFit="cover"
            />
            <View style={styles.rowInfo}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatPrice(item.price)} · {item.tryOnImage ? 'Essayable' : 'Pas d’image d’essayage'}
              </ThemedText>
            </View>
            <Button
              label={item.tryOnImage ? 'Modifier' : 'Essayage'}
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/admin/products/[id]/tryon-image',
                  params: { id: item.id },
                })
              }
            />
          </View>
        )}
        ListFooterComponent={
          <Button label="Se déconnecter" variant="secondary" onPress={logout} />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    marginBottom: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.half,
  },
});
