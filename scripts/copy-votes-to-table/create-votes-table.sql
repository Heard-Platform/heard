drop table if exists votes;

create table votes (
  id text primary key,
  "statementId" text not null,
  "userId" text not null,
  "voteType" text not null,
  source text,
  "flyerId" text,
  "flyerGroup" integer,
  "anonymousUserId" text,
  "timestamp" bigint not null,
  unique ("statementId", "userId")
);

create index votes_user_id_idx on votes ("userId");

alter table votes enable row level security;
