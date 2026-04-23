create table if not exists user_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  "userId" text,
  "roomId" text,
  "createdAt" timestamp with time zone default now()
);

create index if not exists user_events_type_idx on user_events (type);
