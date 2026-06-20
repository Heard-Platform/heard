create table if not exists scraped_items (
  id                    bigserial primary key,
  guid                  text not null,
  title                 text not null,
  "bodyExcerpt"         text not null,
  source                text not null,
  url                   text not null,
  "imageUrl"            text,
  "publishedAt"         bigint not null,
  "scrapedAt"           bigint not null,
  status                text not null,
  rank                  int,
  "generatedTopic"      text,
  "generatedStatements" jsonb,
  "publishedRoomId"     text,
  error                 text,
  "decidedAt"           bigint,
  unique (source, guid)
);

create index if not exists scraped_items_source_status_idx on scraped_items (source, status);
