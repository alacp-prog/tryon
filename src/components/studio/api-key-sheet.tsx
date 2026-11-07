import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ApiKeySheetProps {
  visible: boolean;
  initialKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
}

/** Settings for the optional Remove.bg background replacement. */
export function ApiKeySheet({ visible, initialKey, onClose, onSave }: ApiKeySheetProps) {
  const theme = useTheme();
  const [key, setKey] = useState(initialKey);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
          <ThemedText type="default" style={styles.title}>
            Fond studio par IA
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sans clé, l’app détecte la silhouette sur l’appareil et garde le fond d’origine. Avec
            une clé Remove.bg (50 images gratuites par mois), le fond est remplacé par la couleur
            choisie. La clé reste sur ce téléphone le temps de la session.
          </ThemedText>
          <FormField
            label="Clé API Remove.bg"
            value={key}
            onChangeText={setKey}
            placeholder="Collez votre clé ici"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <View style={styles.actions}>
            {initialKey ? (
              <Button
                label="Retirer la clé"
                variant="secondary"
                onPress={() => onSave('')}
                style={styles.action}
              />
            ) : null}
            <Button label="Enregistrer" onPress={() => onSave(key)} style={styles.action} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
