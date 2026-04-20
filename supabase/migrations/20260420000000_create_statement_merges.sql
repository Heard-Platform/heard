create table statement_merges (
  id uuid primary key default gen_random_uuid(),
  "roomId" text not null,
  "sourceStatementId" text not null,
  "targetStatementId" text not null,
  "creatorId" text not null,
  "createdAt" timestamp with time zone default now()
);

create index on statement_merges ("roomId");
