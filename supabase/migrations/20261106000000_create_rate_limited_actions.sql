create table rate_limited_actions (
  "userId" text not null,
  type text not null,
  "lastActionAt" bigint not null,
  primary key ("userId", type)
);
