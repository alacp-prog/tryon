import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StudioHeaderProps {
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function StudioHeader({ hasApiKey, onOpenSettings }: StudioHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">Studio</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réglages du détourage"
          onPress={onOpenSettings}
          hitSlop={8}
          style={({ pressed }) => [
            styles.settingsButton,
            {
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <MaterialCommunityIcons name="tune-variant" size={20} color={theme.text} />
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Analysez une photo de vous : détection de la silhouette et fond studio pour l’essayage.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenSettings}
        style={[styles.engineChip, { backgroundColor: theme.backgroundElement }]}>
        <MaterialCommunityIcons
          name={hasApiKey ? 'cloud-check-outline' : 'cellphone'}
          size={14}
          color={Accent}
        />
        <ThemedText type="smallBold" style={{ color: Accent }}>
          {hasApiKey ? 'Fond studio IA (Remove.bg)' : 'Analyse sur l’appareil'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
});
