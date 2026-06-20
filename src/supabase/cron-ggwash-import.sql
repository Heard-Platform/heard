-- Schedule the GGWash importer to run every 12 hours
SELECT cron.schedule(
  'ggwash-import',
  '0 */12 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4/enrichment/ggwash-import/run',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'anon_key'
        ),
        'X-Cron-Secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'cron_secret'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
