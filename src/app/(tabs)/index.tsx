import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/catalog/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScreenState } from '@/components/ui/screen-state';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from '@/lib/supabase';
import { CATALOG_PAGE_SIZE, listActiveProducts } from '@/services/products';
import type { Product } from '@/types/product';

interface CatalogState {
  products: Product[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const INITIAL_STATE: CatalogState = {
  products: [],
  page: 0,
  hasMore: true,
  isLoading: true,
  isRefreshing: false,
  error: null,
};

/** US01 : le client consulte le catalogue. */
export default function CatalogScreen() {
  const [state, setState] = useState<CatalogState>(INITIAL_STATE);

  const loadPage = useCallback(async (page: number, mode: 'replace' | 'append') => {
    try {
      const products = await listActiveProducts(page);
      setState((previous) => ({
        products: mode === 'replace' ? products : [...previous.products, ...products],
        page,
        hasMore: products.length === CATALOG_PAGE_SIZE,
        isLoading: false,
        isRefreshing: false,
        error: null,
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        isLoading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue.',
      }));
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) loadPage(0, 'replace');
  }, [loadPage]);

  const refresh = () => {
    setState((previous) => ({ ...previous, isRefreshing: true }));
    loadPage(0, 'replace');
  };

  const loadMore = () => {
    if (state.isLoading || state.isRefreshing || !state.hasMore || state.error) return;
    setState((previous) => ({ ...previous, isLoading: true }));
    loadPage(state.page + 1, 'append');
  };

  const openTryOn = (product: Product) => {
    router.push({ pathname: '/tryon/[productId]', params: { productId: product.id } });
  };

  const renderBody = () => {
    if (!isSupabaseConfigured) {
      return <ScreenState kind="error" message={SUPABASE_NOT_CONFIGURED_MESSAGE} />;
    }
    if (state.isLoading && state.products.length === 0) {
      return <ScreenState kind="loading" message="Chargement du catalogue…" />;
    }
    if (state.error && state.products.length === 0) {
      return (
        <ScreenState
          kind="error"
          message={state.error}
          actionLabel="Réessayer"
          onAction={() => {
            setState(INITIAL_STATE);
            loadPage(0, 'replace');
          }}
        />
      );
    }
    return (
      <FlatList
        data={state.products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} onTryOn={openTryOn} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={state.isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <ScreenState kind="empty" message="Aucun vêtement disponible pour le moment." />
        }
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Catalogue</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Touchez un vêtement « Essayable » pour le voir sur vous.
          </ThemedText>
        </View>
        {renderBody()}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    flexGrow: 1,
  },
  row: {
    gap: Spacing.three,
  },
});
