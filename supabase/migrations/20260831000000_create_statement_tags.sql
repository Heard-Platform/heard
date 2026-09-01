create table statement_tags (
  id uuid primary key default gen_random_uuid(),
  "roomId" text not null,
  name text not null,
  "createdBy" text not null,
  "createdAt" timestamp with time zone default now(),
  unique ("roomId", name)
);

create index on statement_tags ("roomId");

create table statement_tag_links (
  "statementId" text not null,
  "tagId" uuid not null references statement_tags(id) on delete cascade,
  "roomId" text not null,
  "createdBy" text not null,
  "createdAt" timestamp with time zone default now(),
  primary key ("statementId", "tagId")
);

create index on statement_tag_links ("roomId");
create index on statement_tag_links ("tagId");
