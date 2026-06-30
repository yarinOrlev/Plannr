# Plannr — CLAUDE.md

## What This Is
Product management SPA for Israeli R&D orgs. Hebrew RTL UI. React 19 + Vite 7 + Tailwind 3 + Supabase + React Router 7 + Lucide React.

## Architecture at a Glance
```
src/
  App.jsx              → Router, ProtectedRoute guard
  main.jsx             → Entry; wraps: Router > AuthProvider > ProductProvider > App
  supabaseClient.js    → Supabase singleton
  context/
    AuthContext.jsx    → user, isAuthenticated, isHoD, isTeamLead, userProfile, loading
    ProductContext.jsx → ALL data + ALL CRUD (1722 lines — see Navigation Rules)
  views/               → 14 route views, each paired with a .css file
  components/          → Sidebar, Header, FloatingNoteBubble, MultiProductSelector, SharingModal, etc.
  utils/logger.js      → logger.info / logger.error
```

## Roles
| Role | Access |
|---|---|
| HoD (Head of Dept) | All teams + all products; sees `/department` |
| TeamLead | Own team routes: `/team/capacity`, `/team/sprints`, `/team/planning` |
| PM (default) | Product routes only |

## Supabase Tables
`products`, `features`, `strategy`, `roadmaps`, `roadmap_boards`, `objectives`, `notes`, `reviews`, `customers`, `documentation`, `teams`, `team_members`, `members`, `sprints`, `tasks`, `member_sprint_capacity`, `feature_tasks`, `product_users`, `product_shares`

## CRUD Pattern (follow exactly)
```js
const { data: inserted, error } = await supabase.from('table').insert([row]).select();
if (error) throw error;
setData(prev => ({ ...prev, key: [...prev.key, inserted[0]] }));
```
Always: handle error → throw → update local state after success. No optimistic updates.

## State Shape
`data` object in ProductContext holds all arrays. Derived selectors (activeFeatures, activeObjectives, etc.) are computed at render from `selectedProductIds`. Real-time sync via single Supabase channel `plannr-app-changes`.

## RICE Scoring
Fields: `reach`, `impact`, `confidence` (multipliers) / `effort` (divider). Score = (R×I×C)/E. Config stored in `scoringConfig` array + localStorage.

## Dev Commands
```bash
npm run dev     # port 5173
npm run build
npm run lint
```

---

## Navigation Rules (Token Efficiency)

**NEVER read ProductContext.jsx in full.** It is 1722 lines. Instead:
- Find a function: `Grep "const addFeature" src/context/ProductContext.jsx`
- Read a function: `Read` with `offset` + `limit` once you know the line number
- Read a view: views are 100–400 lines, safe to read fully
- Read a component: components are short, safe to read fully

**When to use Glob vs Grep:**
- "Find the file for Roadmaps view" → Glob `src/views/Roadmap*`
- "Find where updateSprint is called" → Grep `updateSprint` in `src/`
- "Find all CSS classes for a component" → Grep class names in the paired `.css` file

**Skip always:** `node_modules/`, `dist/`, `.git/`

**Don't re-read** a file you just edited. Trust the edit succeeded.

---

## Code Conventions
- No comments unless the WHY is non-obvious
- No new abstractions for one-off tasks
- Follow the exact error handling pattern already in ProductContext (try/catch, logger.error)
- Hebrew strings: never change unless explicitly asked
- Each new view = `views/MyView.jsx` + `views/MyView.css`
- Each new shared component = `components/MyComp.jsx` + `components/MyComp.css`
- IDs: `prod_${Date.now()}`, `feat_${Date.now()}`, etc. (existing pattern)
- Don't use `crypto.randomUUID()` for products/features (only used in team-planning tables)

## CSS Conventions
- Tailwind utility classes for layout/spacing
- Custom CSS files for component-specific styles
- RTL layout: use `dir="rtl"` or Tailwind `rtl:` prefix
- Dark mode: check existing `.dark` class usage before adding new dark styles
- Don't invent new CSS class names without first grepping for existing ones

## When NOT to Use Tools
- Do NOT run `npm run dev` to verify a logic-only change
- Do NOT read `src/index.css` for component-specific style questions (check the component's own `.css` file)
- Do NOT grep `node_modules` — add `--glob '!**/node_modules/**'` if searching broadly
- Do NOT read AuthContext unless the task is auth-related
- Do NOT read supabaseClient.js — it just exports `supabase`

---

## Workflow Heuristics

### Bug Fix
1. Grep for the symptom (error message, function name, component name)
2. Read only the relevant file section (offset + limit)
3. Fix in place. Done.

### New Feature (View)
1. Check `src/App.jsx` for routing pattern (already read — don't re-read)
2. Grep `ProductContext.jsx` for any relevant data keys
3. Create `views/FeatureName.jsx` + `views/FeatureName.css`
4. Add route to `App.jsx`
5. If new Supabase table needed: follow fetchTable pattern in ProductContext

### New CRUD Operation
1. Grep for a similar existing operation (e.g., `addNote`) to find the pattern
2. Read only that function's lines
3. Replicate the pattern exactly

### Refactor
1. Spawn Explore subagent for breadth-first discovery
2. Main agent makes targeted edits once locations are confirmed

### UI Change
1. Read the view's `.jsx` file
2. Grep the paired `.css` file for existing classes
3. Use Tailwind first; custom CSS only for what Tailwind can't do

---

## Subagent Decision Tree
- "Where is X defined / which files use Y?" → **Explore agent** (breadth search)
- "Review this approach" → **code-reviewer agent**
- Broad multi-file search (>3 Grep queries needed) → **Explore agent**
- Everything else → handle inline

## MCP Tools Available
- `mcp__Claude_Preview__preview_start` — start dev preview
- `mcp__Claude_in_Chrome__navigate` + `tabs_context_mcp` — browser inspection

## Pre-Approved Bash Patterns
- `npm run *`
- `git add *`, `git commit -m '...'`, `git push *`
- `npx skills *`

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
