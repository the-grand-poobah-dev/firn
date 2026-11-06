-- Index idempotency lookups and cleanup, plus the position foreign key.
create index if not exists position_requests_position_id_idx on public.position_requests(position_id);
create index if not exists position_requests_user_created_at_idx on public.position_requests(user_id,created_at);
