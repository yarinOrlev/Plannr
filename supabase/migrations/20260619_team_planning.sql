-- ============================================================================
-- Team-Lead Planning module — schema
-- ----------------------------------------------------------------------------
-- Introduces the primitives a Team Lead needs to break PM requirements
-- (roadmap items / features) into estimated, assigned, sprint-packed work and
-- to reason about team capacity in person-days.
--
-- New tables (all keyed off the existing real `teams` table, NOT the
-- client-only `availableTeams` string list):
--   members                 — the roster (people, not necessarily app users)
--   sprints                 — time-boxed iterations for a team
--   member_sprint_capacity  — per-person availability override (PTO/holidays)
--   tasks                   — breakdown of PM requirements into person-day work
--
-- Conventions match the rest of the app:
--   * ids are text, generated client-side as `prefix_${Date.now()}`
--   * snake_case columns
--   * JSON where the app already uses JSON
--
-- HOW TO RUN: paste this whole file into the Supabase SQL editor (or apply via
-- the Supabase CLI). It is idempotent (IF NOT EXISTS / drop-and-recreate
-- policies), so re-running is safe.
-- ============================================================================

-- ── members ────────────────────────────────────────────────────────────────
create table if not exists public.members (
  id              text primary key,
  team_id         text not null references public.teams(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  name            text not null,
  role_title      text,
  capacity_factor numeric not null default 1,   -- 0..1, e.g. 0.5 = part-time
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists members_team_id_idx on public.members(team_id);

-- ── sprints ──────────────────────────────────────────────────────────────--
create table if not exists public.sprints (
  id            text primary key,
  team_id       text not null references public.teams(id) on delete cascade,
  name          text not null,
  start_date    date,
  end_date      date,
  working_days  integer not null default 10,    -- default capacity days / person
  quarter       text,                           -- derived from start_date, stored for rollup
  year          text,
  goal          text,
  status        text not null default 'planning', -- planning | active | completed
  created_at    timestamptz not null default now()
);
create index if not exists sprints_team_id_idx on public.sprints(team_id);

-- ── member_sprint_capacity ───────────────────────────────────────────────--
-- Overrides the default (working_days * capacity_factor) for a specific
-- member in a specific sprint, to capture PTO / holidays / partial allocation.
create table if not exists public.member_sprint_capacity (
  id             text primary key,
  sprint_id      text not null references public.sprints(id) on delete cascade,
  member_id      text not null references public.members(id) on delete cascade,
  available_days numeric not null default 0,
  note           text,
  created_at     timestamptz not null default now(),
  unique (sprint_id, member_id)
);
create index if not exists msc_sprint_id_idx on public.member_sprint_capacity(sprint_id);
create index if not exists msc_member_id_idx on public.member_sprint_capacity(member_id);

-- ── tasks ────────────────────────────────────────────────────────────────--
-- The breakdown of PM requirements. Links back to the originating roadmap
-- item and/or feature so the PM roadmap stays the single source of truth.
create table if not exists public.tasks (
  id                 text primary key,
  team_id            text not null references public.teams(id) on delete cascade,
  sprint_id          text references public.sprints(id) on delete set null, -- null = backlog
  roadmap_item_id    text,                 -- soft link to roadmaps.id (PM requirement)
  feature_id         text,                 -- soft link to features.id
  product_id         text,
  title              text not null,
  description        text,
  estimate_days      numeric not null default 1,
  assignee_member_id text references public.members(id) on delete set null,
  status             text not null default 'Todo', -- Todo | InProgress | Done | Blocked
  "order"            integer not null default 0,
  created_at         timestamptz not null default now()
);
create index if not exists tasks_team_id_idx     on public.tasks(team_id);
create index if not exists tasks_sprint_id_idx   on public.tasks(sprint_id);
create index if not exists tasks_roadmap_item_idx on public.tasks(roadmap_item_id);

-- ── Realtime ─────────────────────────────────────────────────────────────--
-- ProductContext subscribes to all `public` changes, but Supabase only streams
-- tables that belong to the `supabase_realtime` publication. Add the new ones.
-- (Wrapped so re-running does not error if already a member.)
do $$
begin
  begin alter publication supabase_realtime add table public.members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sprints; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.member_sprint_capacity; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tasks; exception when duplicate_object then null; end;
end $$;

-- ── Row Level Security ───────────────────────────────────────────────────--
-- The app currently does data scoping client-side (in fetchAllData) using the
-- authenticated anon key. To stay consistent and avoid breaking HoD's
-- all-teams visibility, these policies grant any *authenticated* user access;
-- visibility is still scoped in the client. A stricter, team-membership-based
-- policy is sketched at the bottom as a follow-up to opt into later.
alter table public.members                enable row level security;
alter table public.sprints                enable row level security;
alter table public.member_sprint_capacity enable row level security;
alter table public.tasks                  enable row level security;

drop policy if exists "authenticated full access" on public.members;
create policy "authenticated full access" on public.members
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.sprints;
create policy "authenticated full access" on public.sprints
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.member_sprint_capacity;
create policy "authenticated full access" on public.member_sprint_capacity
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.tasks;
create policy "authenticated full access" on public.tasks
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- FOLLOW-UP (do NOT enable yet): stricter team-scoped policy example.
-- Verify teams/team_members RLS first — restrictive RLS on those tables can
-- make the subquery return nothing and lock users out.
--
--   create policy "team scoped" on public.tasks for all to authenticated
--   using (
--     team_id in (
--       select team_id from public.team_members where user_id = auth.uid()
--       union
--       select id from public.teams where owner_id = auth.uid()
--     )
--   );
-- ----------------------------------------------------------------------------
