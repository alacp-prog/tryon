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
