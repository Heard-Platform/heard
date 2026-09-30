alter table votes add column if not exists "flyerGroup" integer;

create table flyer_placements (
  id uuid primary key default gen_random_uuid(),
  "roomId" text not null,
  "statementId" text not null,
  "flyerGroup" integer not null check ("flyerGroup" > 0),
  latitude double precision not null,
  longitude double precision not null,
  "headingDeg" double precision check ("headingDeg" >= 0 and "headingDeg" < 360),
  "createdBy" text not null,
  "createdAt" timestamp with time zone default now(),
  unique ("statementId", "flyerGroup")
);

create index on flyer_placements ("roomId");
