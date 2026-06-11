create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  "stripeSessionId" text unique,
  amount integer not null,
  mode text not null default 'test',
  notes text,
  "createdAt" timestamp with time zone default now()
);

create index if not exists donations_created_at_idx on donations ("createdAt");
create index if not exists donations_stripe_session_id_idx on donations ("stripeSessionId");
