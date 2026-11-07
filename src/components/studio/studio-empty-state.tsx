import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TIPS: readonly { icon: IconName; text: string }[] = [
  { icon: 'human-handsdown', text: 'Corps entier ou à mi-corps, de face' },
  { icon: 'white-balance-sunny', text: 'Bonne lumière, sans contre-jour' },
  {
    icon: 'image-filter-center-focus',
    text: 'Fond simple, sans autre personne',
  },
];

interface StudioEmptyStateProps {
  onCamera: () => void;
  onGallery: () => void;
  onDemo: () => void;
}

export function StudioEmptyState({ onCamera, onGallery, onDemo }: StudioEmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
          <MaterialCommunityIcons name="account-box-outline" size={40} color={Accent} />
        </View>
        <ThemedText type="default" style={styles.title}>
          Prêt pour la capture
        </ThemedText>
      </View>

      <View style={styles.tips}>
        {TIPS.map((tip) => (
          <View key={tip.text} style={styles.tip}>
            <MaterialCommunityIcons name={tip.icon} size={20} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
              {tip.text}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Prendre une photo" onPress={onCamera} />
        <Button label="Choisir dans la galerie" variant="secondary" onPress={onGallery} />
        <Pressable accessibilityRole="button" onPress={onDemo} style={styles.demoLink}>
          <ThemedText type="smallBold" style={{ color: Accent }}>
            Essayer avec une photo de démonstration
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  tips: {
    gap: Spacing.two,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tipText: {
    flex: 1,
  },
  actions: {
    gap: Spacing.two,
  },
  demoLink: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
