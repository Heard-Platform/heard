create table sent_emails (
  id uuid primary key default gen_random_uuid(),
  "userId" text not null,
  "emailType" text not null,
  "sentAt" timestamp with time zone default now(),
  unique ("userId", "emailType")
);

-- 7 PM Eastern is 23:00 UTC in daylight time and 00:00 UTC in standard time.
-- The job runs at both and no-ops before 7 PM Eastern; sent_emails keeps the second run from resending.
select cron.schedule(
  'flyer-results-email',
  '0 0,23 * * *',
  $$
  select net.http_post(
    url := 'https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4/cron/flyer-results-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', (select decrypted_secret from vault.decrypted_secrets where name = 'heard_api_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
