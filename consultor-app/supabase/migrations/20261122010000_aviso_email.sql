-- Aviso por email cuando alguien agenda.
-- Antes de pulsar Run, cambia las DOS líneas marcadas con «CAMBIA».
-- Pégalo en Supabase → SQL Editor → New query → Run.

create extension if not exists pg_net with schema extensions;

-- Guarda la dirección de la función y la clave secreta en el Vault (cifradas).
select vault.create_secret(
  'https://TU-PROYECTO.supabase.co/functions/v1/aviso-nueva-cita',  -- CAMBIA: tu Project URL + /functions/v1/aviso-nueva-cita
  'aviso_url'
);
select vault.create_secret(
  'PEGA-AQUI-TU-CLAVE-SECRETA',                                      -- CAMBIA: inventa una clave larga (la misma que AVISO_SECRETO)
  'aviso_secreto'
);

create or replace function public.avisar_nueva_cita()
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

  -- Si aún no está configurado, la reserva se guarda igual, solo que sin email.
  if url is null or secreto is null or url like '%TU-PROYECTO%' then
    return new;
  end if;

  -- pg_net envía la petición en segundo plano y solo si la reserva se guardó:
  -- un fallo del email nunca impide que el cliente reserve.
  perform net.http_post(
    url := url,
    body := jsonb_build_object('type', 'INSERT', 'table', 'citas', 'record', to_jsonb(new)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso-secreto', secreto)
  );
  return new;
end;
$$;

revoke all on function public.avisar_nueva_cita() from public, anon, authenticated;

create trigger citas_aviso_email
  after insert on public.citas
  for each row execute function public.avisar_nueva_cita();
