create table if not exists llm_api_calls (
  id uuid primary key default gen_random_uuid(),
  "createdAt" timestamp with time zone default now(),
  provider text not null,
  model text not null,
  "userId" text,
  endpoint text not null,
  "inputTokens" int not null,
  "outputTokens" int not null,
  "totalTokens" int not null
);

create index if not exists llm_api_calls_created_at_idx on llm_api_calls ("createdAt");
create index if not exists llm_api_calls_provider_idx on llm_api_calls (provider);
create index if not exists llm_api_calls_user_id_idx on llm_api_calls ("userId");
create index if not exists llm_api_calls_endpoint_idx on llm_api_calls (endpoint);
