-- Données de démonstration + rôle responsable. Réexécutable sans doublons.

-- ---------------------------------------------------------------------------
-- Rôle responsable : donné à tous les comptes existants au moment de l'exécution.
-- L'app n'a pas d'inscription client : les seuls comptes sont ceux créés dans
-- Authentication > Users. Désactivez aussi « Allow new users to sign up ».
-- ---------------------------------------------------------------------------
insert into public.admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Catalogue de démonstration
-- ---------------------------------------------------------------------------
insert into public.products (id, name, description, price, category, image_url)
values
  ('00000000-0000-4000-8000-000000000001', 'T-shirt col rond',
   'T-shirt col rond 100 % coton, coupe droite.', 39.90, 'haut',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000002', 'T-shirt imprimé',
   'T-shirt écru à grand imprimé bleu.', 29.90, 'haut',
   'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000003', 'Blouson en cuir',
   'Blouson perfecto en cuir noir, zips métalliques.', 149.00, 'veste',
   'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000004', 'Jean droit',
   'Jean coupe droite, brut ou délavé.', 119.00, 'bas',
   'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000005', 'Robe longue rouge',
   'Robe longue fluide pour les grandes occasions.', 135.00, 'robe',
   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000006', 'T-shirt noir',
   'T-shirt noir avec logo brodé.', 45.00, 'haut',
   'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80')
on conflict (id) do nothing;
