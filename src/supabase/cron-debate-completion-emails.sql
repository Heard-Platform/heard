-- Schedule the debate-completion email cron to run every hour
-- The endpoint looks back for recently-ended rooms and emails
-- participants. Checks for previous emails to avoid duplicates.

SELECT cron.schedule(
  'send-debate-completion-emails',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4/cron/send-completion-celebrations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'anon_key'
        ),
        'X-API-Key', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'heard_api_key'
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
