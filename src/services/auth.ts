import type { Session } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';
import { type LoginValues } from '@/types/product';

/** Maps Supabase auth errors to messages a shop manager can act on. */
function toLoginMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(message)) return 'Adresse e-mail non confirmée.';
  if (/network|fetch/i.test(message)) return 'Connexion impossible : vérifiez votre réseau.';
  return 'La connexion a échoué. Réessayez.';
}

export async function signIn({ email, password }: LoginValues): Promise<Session> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(toLoginMessage(error?.message ?? ''));
  }

  const isAdmin = await fetchIsAdmin();
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error('Ce compte n’a pas accès à l’espace responsable.');
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error('La déconnexion a échoué.');
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) return null;
  return data.session;
}

export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_admin');
  if (error) return false;
  return data === true;
}

export function onSessionChange(listener: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}
