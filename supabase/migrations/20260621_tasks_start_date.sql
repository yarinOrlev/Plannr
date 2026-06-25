-- ============================================================================
-- Team-Lead Planning — add tasks.start_date
-- ----------------------------------------------------------------------------
-- The sprint-planning view becomes a per-member Gantt across the quarter, so a
-- task needs an explicit position in time. `start_date` is where the task's bar
-- begins; `estimate_days` remains its length. `sprint_id` stays the sprint the
-- task counts toward for capacity (derived from start_date on the client).
--
-- Additive and idempotent — safe to run on the existing (already-applied)
-- schema. Apply via the Supabase SQL editor (see supabase/README.md).
-- ============================================================================

alter table public.tasks add column if not exists start_date date;
