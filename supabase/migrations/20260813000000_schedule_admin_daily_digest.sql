create extension if not exists pg_cron;
create extension if not exists pg_net;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'admin-daily-digest',
  '0 13 * * *',
  $$
  select net.http_post(
    url := 'https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4/cron/admin-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', (select decrypted_secret from vault.decrypted_secrets where name = 'heard_api_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
