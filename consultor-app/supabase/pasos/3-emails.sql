-- PASO 3 · Emails automáticos (reservas y cancelaciones).
-- Antes de pulsar Run, cambia las DOS líneas marcadas con «CAMBIA».
-- Pégalo en Supabase → SQL Editor → New query → Run.
-- Puedes ejecutarlo otra vez sin problema para corregir la dirección o la clave.

create extension if not exists pg_net with schema extensions;

-- Guarda la dirección de la función y la clave secreta en el Vault (cifradas).
-- Si ya existían de una ejecución anterior, primero se borran.
delete from vault.secrets where name in ('aviso_url', 'aviso_secreto');
select vault.create_secret(
  'https://TU-PROYECTO.supabase.co/functions/v1/aviso-nueva-cita',  -- CAMBIA: tu Project URL + /functions/v1/aviso-nueva-cita
  'aviso_url'
);
select vault.create_secret(
  'PEGA-AQUI-TU-CLAVE-SECRETA',                                      -- CAMBIA: inventa una clave larga (la misma que AVISO_SECRETO)
  'aviso_secreto'
);

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
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) end,
      -- Solo el dueño de la cita es «cliente». Si cancelas desde la app o desde
      -- el panel de Supabase, cuenta como cancelada por el consultor.
      'cancelada_por', case
        when tg_op <> 'UPDATE' then null
        when (select auth.uid()) = new.user_id then 'cliente'
        else 'consultor'
      end
    ),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso-secreto', secreto)
  );
  return new;
end;
$$;

revoke all on function public.avisar_cita() from public, anon, authenticated;

-- Reserva nueva.
drop trigger if exists citas_aviso_email on public.citas;
create trigger citas_aviso_email
  after insert on public.citas
  for each row execute function public.avisar_cita();

-- Cancelación (la haga el cliente o tú).
drop trigger if exists citas_aviso_cancelacion on public.citas;
create trigger citas_aviso_cancelacion
  after update of estado on public.citas
  for each row
  when (old.estado = 'confirmada' and new.estado = 'cancelada')
  execute function public.avisar_cita();
