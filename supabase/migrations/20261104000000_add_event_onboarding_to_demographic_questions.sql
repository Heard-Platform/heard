alter table demographic_questions add column if not exists "eventId" bigint;
alter table demographic_questions add column if not exists "multiSelect" boolean not null default false;
alter table demographic_questions add column if not exists "position" integer;
alter table demographic_questions alter column "roomId" drop not null;

alter table demographic_questions
  add constraint demographic_questions_belongs_to_room_or_event
  check (("roomId" is null) <> ("eventId" is null));

create index if not exists demographic_questions_event_id_idx on demographic_questions ("eventId");
