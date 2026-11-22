-- Muestra la agenda del panel de Supabase en hora del centro de México.
-- No hay nada que cambiar: pégalo en Supabase → SQL Editor → New query → Run.

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
