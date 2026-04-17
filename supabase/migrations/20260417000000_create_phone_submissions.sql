create table if not exists phone_submissions (
  id bigint generated always as identity primary key,
  phone text not null,
  createdAt timestamptz not null default now()
);
