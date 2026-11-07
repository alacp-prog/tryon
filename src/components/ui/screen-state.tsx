import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

interface ScreenStateProps {
  kind: 'loading' | 'empty' | 'error';
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-screen placeholder for loading, empty and error states. */
export function ScreenState({ kind, message, actionLabel, onAction }: ScreenStateProps) {
  return (
    <View style={styles.container}>
      {kind === 'loading' ? <ActivityIndicator size="large" /> : null}
      {message ? (
        <ThemedText style={styles.message} themeColor={kind === 'error' ? 'text' : 'textSecondary'}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
});
