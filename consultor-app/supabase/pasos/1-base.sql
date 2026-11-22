-- PASO 1 · Base de datos de la agenda.
-- Pégalo completo en Supabase → SQL Editor → New query → Run. No hay nada que cambiar.

-- 1. Tabla ------------------------------------------------------------------
create table public.citas (
  id           uuid primary key default gen_random_uuid(),
  -- Cada teléfono inicia una sesión anónima; así sabemos de quién es cada cita.
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inicio       timestamptz not null,
  duracion_min integer not null default 60 check (duracion_min between 15 and 240),
  modalidad    text not null check (modalidad in ('videollamada', 'presencial')),
  tema         text not null check (char_length(tema) between 1 and 80),
  nombre       text not null check (char_length(nombre) between 2 and 120),
  telefono     text not null check (char_length(telefono) between 7 and 30),
  email        text not null default '' check (char_length(email) <= 200),
  comentario   text not null default '' check (char_length(comentario) <= 1000),
  estado       text not null default 'confirmada' check (estado in ('confirmada', 'cancelada')),
  creada_en    timestamptz not null default now()
);

-- Un mismo horario no puede tener dos citas confirmadas.
create unique index citas_horario_unico on public.citas (inicio) where estado = 'confirmada';
create index citas_user_id on public.citas (user_id);

-- 2. Validaciones al reservar ------------------------------------------------
create or replace function public.validar_nueva_cita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.inicio <= now() then
    raise exception 'La cita debe ser en el futuro.' using errcode = 'P0001';
  end if;
  if new.inicio > now() + interval '60 days' then
    raise exception 'Solo se puede reservar hasta 60 días antes.' using errcode = 'P0001';
  end if;
  if extract(minute from new.inicio)::int % 15 <> 0 or extract(second from new.inicio) <> 0 then
    raise exception 'Horario no válido.' using errcode = 'P0001';
  end if;
  -- Evita que una sola persona bloquee toda la agenda.
  if (select count(*) from public.citas c
      where c.user_id = new.user_id and c.estado = 'confirmada' and c.inicio > now()) >= 3 then
    raise exception 'Ya tienes 3 citas próximas. Cancela una para reservar otra.'
      using errcode = 'P0002';
  end if;
  new.estado := 'confirmada';
  new.creada_en := now();
  return new;
end;
$$;

create trigger citas_validar_nueva
  before insert on public.citas
  for each row execute function public.validar_nueva_cita();

-- 3. Permisos (Row Level Security) -------------------------------------------
alter table public.citas enable row level security;

revoke all on public.citas from anon, authenticated;
grant select, insert on public.citas to authenticated;
-- Los clientes solo pueden cambiar el estado (para cancelar), nada más.
grant update (estado) on public.citas to authenticated;

create policy "Cada cliente ve sus citas"
  on public.citas for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Cada cliente crea citas a su nombre"
  on public.citas for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Cada cliente cancela sus citas"
  on public.citas for update to authenticated
  using (user_id = (select auth.uid()) and estado = 'confirmada')
  with check (user_id = (select auth.uid()) and estado = 'cancelada');

-- 4. Horarios ocupados (sin datos personales) --------------------------------
-- Los clientes necesitan saber qué horas están tomadas, pero no por quién.
create or replace function public.horarios_ocupados(desde timestamptz, hasta timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select c.inicio from public.citas c
  where c.estado = 'confirmada' and c.inicio >= desde and c.inicio < hasta
  order by c.inicio;
$$;

revoke all on function public.horarios_ocupados(timestamptz, timestamptz) from public;
grant execute on function public.horarios_ocupados(timestamptz, timestamptz) to anon, authenticated;

-- 5. Vista para el consultor (en hora del centro de México) --------------------
-- Ábrela en Table Editor → agenda_consultor. Solo la ves tú desde el panel, nunca la app.
create or replace view public.agenda_consultor as
select
  to_char(c.inicio at time zone 'America/Mexico_City', 'YYYY-MM-DD') as fecha,
  to_char(c.inicio at time zone 'America/Mexico_City', 'HH24:MI')    as hora,
  c.estado,
  c.nombre,
  c.telefono,
  c.email,
  c.modalidad,
  c.tema,
  c.comentario,
  c.inicio,
  c.creada_en,
  c.id
from public.citas c
order by c.inicio desc;

revoke all on public.agenda_consultor from anon, authenticated, public;
