-- Schedule the digest email orchestrator to run daily at noon UTC
-- This cron job triggers the email digest orchestration endpoint

SELECT cron.schedule(
  'orchestrate-digest-email',
  '0 12 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4/cron/orchestrate-digest-email',
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
