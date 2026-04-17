create table flyer_scans (
  id uuid primary key default gen_random_uuid(),
  flyer text not null,
  userId text,
  created_at timestamp with time zone default now()
);
