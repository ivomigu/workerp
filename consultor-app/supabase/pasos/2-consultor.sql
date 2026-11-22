-- PASO 2 · Tu acceso al panel del consultor dentro de la app.
-- ANTES de ejecutarlo: crea tu usuario en Authentication → Users → Add user → Create new user
-- (con tu email y una contraseña, marcando «Auto Confirm User»).
-- Después cambia la línea marcada con «CAMBIA» y pulsa Run.
-- Puedes ejecutarlo otra vez sin problema (por ejemplo, si te equivocaste de email).

-- 1. Quién es consultor --------------------------------------------------------
create table if not exists public.consultores (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.consultores enable row level security;
revoke all on public.consultores from anon, authenticated;

create or replace function public.es_consultor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.consultores where user_id = (select auth.uid()));
$$;
revoke all on function public.es_consultor() from public, anon;
grant execute on function public.es_consultor() to authenticated;

-- 2. Permisos del consultor sobre las citas -------------------------------------
drop policy if exists "El consultor ve todas las citas" on public.citas;
create policy "El consultor ve todas las citas"
  on public.citas for select to authenticated
  using ((select public.es_consultor()));

drop policy if exists "El consultor cancela citas" on public.citas;
create policy "El consultor cancela citas"
  on public.citas for update to authenticated
  using ((select public.es_consultor()) and estado = 'confirmada')
  with check ((select public.es_consultor()) and estado = 'cancelada');

-- 3. Date de alta como consultor -------------------------------------------------
insert into public.consultores (user_id)
select id from auth.users
where email = 'TU-EMAIL@ejemplo.com'   -- CAMBIA: el email del usuario que creaste
on conflict do nothing;

-- Comprueba: debe aparecer tu email. Si sale vacío, revisa el email de arriba.
select u.email from public.consultores c join auth.users u on u.id = c.user_id;
