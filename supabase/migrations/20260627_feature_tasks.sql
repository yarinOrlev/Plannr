-- ============================================================================
-- Feature Tasks — PM-level tasks linked to features with RICE scoring
-- ----------------------------------------------------------------------------
-- Separate from the team-lead `tasks` table (which is sprint/team-scoped).
-- These tasks live under a feature and are owned by the PM, scored with RICE.
--
-- Soft link: feature_id → features.id (text, no FK so features can be deleted
-- without cascading). product_id is stored for efficient product-scoped queries.
-- ============================================================================

create table if not exists public.feature_tasks (
  id           uuid primary key default gen_random_uuid(),
  feature_id   text not null,          -- soft link to features.id
  product_id   text,                   -- copied from the feature for scoping
  title        text not null,
  reach        numeric not null default 1,
  impact       numeric not null default 1,
  confidence   numeric not null default 1,
  effort       numeric not null default 1,
  status       text not null default 'Todo',   -- Todo | InProgress | Done
  "order"      integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists feature_tasks_feature_id_idx on public.feature_tasks(feature_id);
create index if not exists feature_tasks_product_id_idx on public.feature_tasks(product_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.feature_tasks;
  exception when duplicate_object then null;
  end;
end $$;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.feature_tasks enable row level security;

drop policy if exists "authenticated full access" on public.feature_tasks;
create policy "authenticated full access" on public.feature_tasks
  for all to authenticated using (true) with check (true);
