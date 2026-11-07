import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Danger, MaxContentWidth, Spacing } from '@/constants/theme';
import { signIn } from '@/services/auth';
import { firstIssueMessage, loginSchema } from '@/types/product';

/** US11 : connexion du responsable. La redirection est gérée par Stack.Protected. */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La connexion a échoué.');
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
          <ThemedText type="subtitle">Connexion</ThemedText>
          <ThemedText themeColor="textSecondary">
            Réservé aux responsables de la boutique.
          </ThemedText>
          <FormField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@boutique.tn"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <FormField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="Votre mot de passe"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
          />
          {error ? (
            <ThemedText type="small" style={{ color: Danger }} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}
          <Button label="Se connecter" onPress={submit} loading={isSubmitting} />
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
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
