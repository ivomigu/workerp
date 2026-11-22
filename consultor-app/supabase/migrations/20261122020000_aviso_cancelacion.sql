-- Aviso por email también cuando un cliente cancela.
-- Requiere haber ejecutado antes 20261122010000_aviso_email.sql.
-- No hay nada que cambiar: pégalo en Supabase → SQL Editor → New query → Run.

-- Una sola función para los dos avisos (reserva nueva y cancelación).
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

revoke all on function public.avisar_cita() from public, anon, authenticated;

-- Reserva nueva: igual que antes, ahora con la función compartida.
drop trigger if exists citas_aviso_email on public.citas;
create trigger citas_aviso_email
  after insert on public.citas
  for each row execute function public.avisar_cita();

-- Cancelación: solo cuando una cita confirmada pasa a cancelada.
create trigger citas_aviso_cancelacion
  after update of estado on public.citas
  for each row
  when (old.estado = 'confirmada' and new.estado = 'cancelada')
  execute function public.avisar_cita();

drop function if exists public.avisar_nueva_cita();
