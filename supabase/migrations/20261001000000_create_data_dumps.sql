create table data_dumps (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null,
  "createdAt" timestamp with time zone default now()
);
