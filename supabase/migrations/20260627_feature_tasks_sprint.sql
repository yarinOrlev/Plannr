-- ============================================================================
-- Feature Tasks v2 — Sprint planning metadata
-- ----------------------------------------------------------------------------
-- Adds sprint assignment + assignee/CR columns + rich task metadata
-- (description, complexity, estimate_hours) to the feature_tasks table.
--
-- Safe to re-run: every statement uses IF NOT EXISTS / IF NOT EXISTS pattern.
-- ============================================================================

ALTER TABLE public.feature_tasks
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS complexity          text NOT NULL DEFAULT 'M',
  ADD COLUMN IF NOT EXISTS estimate_hours      numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sprint_id           uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignee_member_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cr_reviewer_1_id    uuid REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cr_reviewer_2_id    uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- Indexes for sprint + assignee lookups
CREATE INDEX IF NOT EXISTS feature_tasks_sprint_id_idx   ON public.feature_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS feature_tasks_assignee_idx    ON public.feature_tasks(assignee_member_id);
