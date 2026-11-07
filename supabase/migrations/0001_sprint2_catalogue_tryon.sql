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
