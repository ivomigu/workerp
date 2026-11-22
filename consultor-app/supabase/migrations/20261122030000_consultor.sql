-- Panel del consultor dentro de la app.
-- ANTES de ejecutarlo: crea tu usuario en Authentication → Users → Add user → Create new user
-- (con tu email y una contraseña, marcando «Auto Confirm User»).
-- Después cambia la línea marcada con «CAMBIA» y pulsa Run.

-- 1. Quién es consultor --------------------------------------------------------
create table public.consultores (
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
create policy "El consultor ve todas las citas"
  on public.citas for select to authenticated
  using ((select public.es_consultor()));

create policy "El consultor cancela citas"
  on public.citas for update to authenticated
  using ((select public.es_consultor()) and estado = 'confirmada')
  with check ((select public.es_consultor()) and estado = 'cancelada');

-- 3. No te avises a ti mismo cuando el que cancela eres tú ----------------------
create or replace function public.avisar_cita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  secreto text;
begin
  if tg_op = 'UPDATE' and public.es_consultor() then
    return new;
  end if;

  select decrypted_secret into url from vault.decrypted_secrets where name = 'aviso_url';
  select decrypted_secret into secreto from vault.decrypted_secrets where name = 'aviso_secreto';

  if url is null or secreto is null or url like '%TU-PROYECTO%' then
    return new;
  end if;

  perform net.http_post(
    url := url,
    body := jsonb_build_object(
      'type', tg_op,
      'table', 'citas',
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) end
    ),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso-secreto', secreto)
  );
  return new;
end;
$$;

-- 4. Date de alta como consultor -------------------------------------------------
insert into public.consultores (user_id)
select id from auth.users
where email = 'TU-EMAIL@ejemplo.com'   -- CAMBIA: el email del usuario que creaste
on conflict do nothing;

-- Comprueba: debe aparecer tu email. Si sale vacío, revisa el email de arriba.
select u.email from public.consultores c join auth.users u on u.id = c.user_id;
