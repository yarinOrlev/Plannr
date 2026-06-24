# Supabase

Plannr's backend is a hosted Supabase project (Postgres + Auth + Realtime). The
app talks to it directly from the browser via `src/supabaseClient.js` using the
anon key; there is no server. Schema changes therefore have to be applied to the
Supabase project by hand.

## migrations/

SQL files, named `YYYYMMDD_<name>.sql`, that capture each schema change so it is
reviewable and reproducible. They are **not run automatically** — apply them
yourself.

### Applying a migration

**Option A — Supabase dashboard (simplest):**
1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of the migration file.
3. **Run**. The scripts are idempotent, so re-running is safe.

**Option B — Supabase CLI:**
```bash
supabase db execute --file supabase/migrations/20260619_team_planning.sql
```

After applying, confirm the new tables appear under **Table editor** and that
Realtime is on for them (**Database → Replication → `supabase_realtime`**).

## Current migrations

| File | Adds |
|------|------|
| `20260619_team_planning.sql` | `members`, `sprints`, `member_sprint_capacity`, `tasks` for the team-lead planning module (+ Realtime publication + RLS). |
