create table app_feedback_votes (
  id bigserial primary key,
  "userId" text not null,
  "statementKey" text not null,
  vote text not null,
  "roomId" text not null,
  "votedAt" bigint not null,
  unique ("userId", "statementKey")
);

create index on app_feedback_votes ("userId");
