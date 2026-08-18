alter table user_events add column if not exists "sessionId" text;
create index if not exists user_events_session_id_idx on user_events ("sessionId");
