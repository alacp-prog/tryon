import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';

export const STUDIO_BACKGROUNDS = [
  { label: 'Blanc', value: '#FFFFFF' },
  { label: 'Gris clair', value: '#F0F0F3' },
  { label: 'Crème', value: '#FAF6EE' },
  { label: 'Bleu ciel', value: '#E6F4FE' },
] as const;

interface BackgroundSwatchesProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function BackgroundSwatches({ value, onChange, disabled = false }: BackgroundSwatchesProps) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Couleur du fond studio</ThemedText>
      <View style={styles.row}>
        {STUDIO_BACKGROUNDS.map((color) => {
          const selected = color.value === value;
          return (
            <Pressable
              key={color.value}
              accessibilityRole="radio"
              accessibilityLabel={color.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(color.value)}
              style={[
                styles.swatch,
                {
                  backgroundColor: color.value,
                  borderColor: selected ? Accent : '#C9CCD3',
                },
                selected && styles.swatchSelected,
                disabled && styles.disabled,
              ]}>
              {selected ? <MaterialCommunityIcons name="check" size={18} color={Accent} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const SWATCH_SIZE = 40;

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});
