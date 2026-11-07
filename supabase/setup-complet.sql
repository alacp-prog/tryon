-- Sprint 2 : catalogue (US01), connexion responsable (US11),
-- ajout produit (US12) et image d'essayage (US18).
-- À exécuter dans Supabase > SQL Editor (ou `supabase db push`).

-- ---------------------------------------------------------------------------
-- Rôle administrateur
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins lisent leur propre ligne" on public.admins;
create policy "admins lisent leur propre ligne"
  on public.admins for select
  using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10, 2) not null check (price >= 0),
  category text not null check (category in ('haut', 'bas', 'robe', 'veste', 'accessoire')),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_created_idx
  on public.products (is_active, created_at desc);

alter table public.products enable row level security;

drop policy if exists "catalogue public : produits actifs" on public.products;
create policy "catalogue public : produits actifs"
  on public.products for select
  using (is_active or public.is_admin());

drop policy if exists "admin : création produit" on public.products;
create policy "admin : création produit"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "admin : modification produit" on public.products;
create policy "admin : modification produit"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Image d'essayage (PNG transparent + points d'ancrage normalisés 0..1)
-- ---------------------------------------------------------------------------
create table if not exists public.product_tryon_images (
  product_id uuid primary key references public.products (id) on delete cascade,
  image_url text not null,
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  -- Épaules telles qu'on les voit sur l'image (gauche/droite de l'écran).
  anchor_left_shoulder_x real not null check (anchor_left_shoulder_x between 0 and 1),
  anchor_left_shoulder_y real not null check (anchor_left_shoulder_y between 0 and 1),
  anchor_right_shoulder_x real not null check (anchor_right_shoulder_x between 0 and 1),
  anchor_right_shoulder_y real not null check (anchor_right_shoulder_y between 0 and 1),
  updated_at timestamptz not null default now(),
  check (anchor_left_shoulder_x < anchor_right_shoulder_x)
);

alter table public.product_tryon_images enable row level security;

drop policy if exists "lecture publique des images d'essayage" on public.product_tryon_images;
create policy "lecture publique des images d'essayage"
  on public.product_tryon_images for select
  using (true);

drop policy if exists "admin : écriture image d'essayage" on public.product_tryon_images;
create policy "admin : écriture image d'essayage"
  on public.product_tryon_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Stockage des images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "lecture publique product-images" on storage.objects;
create policy "lecture publique product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admin : upload product-images" on storage.objects;
create policy "admin : upload product-images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin : remplacement product-images" on storage.objects;
create policy "admin : remplacement product-images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

-- Pour donner le rôle responsable à un compte créé dans Authentication > Users :
-- insert into public.admins (user_id) values ('<uuid-du-compte>');


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


-- Tout compte créé devient responsable.
-- PRÉREQUIS DE SÉCURITÉ : inscriptions publiques désactivées
-- (Authentication > Sign In / Providers > « Allow new users to sign up » = off).
-- Les comptes ne peuvent alors être créés que depuis le tableau de bord Supabase.

create or replace function public.grant_admin_to_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admins (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_grant_admin on auth.users;
create trigger on_auth_user_created_grant_admin
  after insert on auth.users
  for each row execute function public.grant_admin_to_new_user();

-- Comptes déjà existants.
insert into public.admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;
