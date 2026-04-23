create table if not exists votes (
  id text primary key,
  "statementId" text not null,
  "userId" text not null,
  "voteType" text not null,
  "timestamp" bigint not null,
  "flyerId" text,
  "anonymousUserId" text
);

create index if not exists votes_statement_id_idx on votes ("statementId");
create index if not exists votes_user_id_idx on votes ("userId");
