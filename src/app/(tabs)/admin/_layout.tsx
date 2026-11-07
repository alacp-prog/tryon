import { Stack } from 'expo-router';

import { ScreenState } from '@/components/ui/screen-state';
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

/** US11 : l'espace de gestion n'est accessible qu'à un responsable connecté. */
export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  if (!isSupabaseConfigured) {
    return <ScreenState kind="error" message={SUPABASE_NOT_CONFIGURED_MESSAGE} />;
  }
  if (isLoading) {
    return <ScreenState kind="loading" message="Vérification de la session…" />;
  }

  return (
    <Stack>
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="index" options={{ title: 'Mes produits' }} />
        <Stack.Screen name="products/new" options={{ title: 'Nouveau produit' }} />
        <Stack.Screen name="products/[id]/tryon-image" options={{ title: 'Image d’essayage' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAdmin}>
        <Stack.Screen name="login" options={{ title: 'Espace responsable' }} />
      </Stack.Protected>
    </Stack>
  );
}
