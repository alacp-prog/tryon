import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/services/product-mapper';
import { CATEGORY_LABELS, type Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onTryOn: (product: Product) => void;
}

export function ProductCard({ product, onTryOn }: ProductCardProps) {
  const theme = useTheme();
  const canTryOn = product.tryOnImage !== null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}${canTryOn ? ', essayable' : ''}`}
      disabled={!canTryOn}
      onPress={() => onTryOn(product)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.imageWrapper}>
        <Image
          source={product.imageUrl ? { uri: product.imageUrl } : undefined}
          contentFit="cover"
          transition={150}
          style={styles.image}
        />
        {canTryOn ? (
          <View style={styles.badge}>
            <ThemedText type="smallBold" style={styles.badgeText}>
              Essayable
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {CATEGORY_LABELS[product.category]}
        </ThemedText>
        <ThemedText type="smallBold">{formatPrice(product.price)}</ThemedText>
        <ThemedText type="small" style={{ color: canTryOn ? Accent : theme.textSecondary }}>
          {canTryOn ? 'Essayer virtuellement ›' : 'Essayage bientôt disponible'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageWrapper: {
    aspectRatio: 3 / 4,
  },
  image: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: Accent,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
  },
  badgeText: {
    color: '#FFFFFF',
  },
  info: {
    padding: Spacing.two,
    gap: Spacing.half,
  },
});
