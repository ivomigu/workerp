-- Avisa a la función también cuando el consultor cancela (desde la app o desde el
-- panel de Supabase), para que el cliente reciba un email. La función sabe quién
-- canceló por «cancelada_por» y, si fuiste tú, no te envía el aviso a ti.
-- No hay nada que cambiar: pégalo en Supabase → SQL Editor → New query → Run.

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
