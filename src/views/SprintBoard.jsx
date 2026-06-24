import React, { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import {
  CalendarRange, Plus, Trash2, Check, X, Users, Layers,
} from 'lucide-react';
import './SprintBoard.css';

// ── Quarter / date helpers ───────────────────────────────────────────────────
const MONTHS_BY_Q = {
  Q1: ['ינואר', 'פברואר', 'מרץ'],
  Q2: ['אפריל', 'מאי', 'יוני'],
  Q3: ['יולי', 'אוגוסט', 'ספטמבר'],
  Q4: ['אוקטובר', 'נובמבר', 'דצמבר'],
};
const Q_NUM = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
const MILESTONE_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#65A30D'];
const ESTIMATE_OPTIONS = [0.5, 1, 2, 3, 5, 8, 13];

const quarterRange = (quarter, year) => {
  const y = Number(year) || new Date().getFullYear();
  const sm = ((Q_NUM[quarter] || 1) - 1) * 3;
  return { start: new Date(y, sm, 1), end: new Date(y, sm + 3, 0) };
};
const toDate = (s) => (s ? new Date(s) : null);
const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : (d || ''));
const pctBetween = (date, start, end) => {
  const span = end - start;
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, ((date - start) / span) * 100));
};

const EMPTY_SPRINT = { name: '', start_date: '', end_date: '', working_days: 10, goal: '' };
const newTaskTemplate = (memberId, startDate) => ({
  _new: true, title: '', estimate_days: 1, assignee_member_id: memberId || '',
  roadmap_item_id: '', start_date: startDate || '',
});

const SprintBoard = () => {
  const {
    activeTeamId, teamSprints, teamRoster, teamTasks, teamProducts,
    teamRoadmapItems, addSprint, deleteSprint,
    addTask, updateTask, deleteTask, getMemberAvailableDays,
    activeQuarter,
  } = useProductContext();

  const [creatingSprint, setCreatingSprint] = useState(false);
  const [sprintDraft, setSprintDraft] = useState(EMPTY_SPRINT);
  const [editor, setEditor] = useState(null); // task being added/edited

  const activeRoster = teamRoster.filter(m => m.active);

  // The quarter is driven by the global selector in the Header.
  const activeQ = activeQuarter;
  const range = quarterRange(activeQ.quarter, activeQ.year);

  const quarterSprints = useMemo(() =>
    teamSprints
      .filter(s => s.quarter === activeQ.quarter && s.year === activeQ.year)
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')),
    [teamSprints, activeQ.quarter, activeQ.year]);

  const milestones = useMemo(() =>
    teamRoadmapItems
      .filter(r => r.bucket === 'Timeline' && r.quarter === activeQ.quarter && r.year === activeQ.year),
    [teamRoadmapItems, activeQ.quarter, activeQ.year]);

  const milestoneColor = useMemo(() => {
    const m = {};
    milestones.forEach((it, i) => { m[it.id] = MILESTONE_COLORS[i % MILESTONE_COLORS.length]; });
    return m;
  }, [milestones]);

  const milestoneIds = milestones.map(m => m.id);
  const quarterSprintIds = quarterSprints.map(s => s.id);

  // Tasks shown in this quarter: by milestone, sprint, or a start_date that falls in range.
  const quarterTasks = useMemo(() => {
    if (!range) return [];
    return teamTasks.filter(t => {
      if (t.roadmap_item_id && milestoneIds.includes(t.roadmap_item_id)) return true;
      if (t.sprint_id && quarterSprintIds.includes(t.sprint_id)) return true;
      const d = toDate(t.start_date);
      return d && d >= range.start && d <= range.end;
    });
  }, [teamTasks, range, milestoneIds, quarterSprintIds]);

  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header"><div>
          <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
          <p className="text-secondary text-lg">תכנון עומס הצוות מול היעדים הרבעוניים</p>
        </div></header>
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <Users size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין צוות עדיין</h3>
          <p className="text-secondary">צור צוות והוסף אנשים במסך "צוות וקיבולת" כדי להתחיל לתכנן.</p>
        </div>
      </div>
    );
  }

  const sprintForDate = (dateStr) => {
    const d = toDate(dateStr);
    if (!d) return null;
    return quarterSprints.find(s => {
      const a = toDate(s.start_date), b = toDate(s.end_date);
      return a && b && d >= a && d <= b;
    }) || null;
  };

  const effectiveStart = (task) => {
    const d = toDate(task.start_date);
    if (d) return d;
    const sp = quarterSprints.find(s => s.id === task.sprint_id);
    return toDate(sp?.start_date) || range.start;
  };

  // Allocated days for a member within a given sprint (by task start position).
  const memberSprintLoad = (memberId, sprint) => {
    const a = toDate(sprint.start_date), b = toDate(sprint.end_date);
    return quarterTasks
      .filter(t => t.assignee_member_id === memberId)
      .filter(t => { const d = effectiveStart(t); return a && b && d >= a && d <= b; })
      .reduce((sum, t) => sum + (Number(t.estimate_days) || 0), 0);
  };
  const memberQuarterLoad = (memberId) =>
    quarterTasks.filter(t => t.assignee_member_id === memberId)
      .reduce((s, t) => s + (Number(t.estimate_days) || 0), 0);
  const memberQuarterCapacity = (memberId) =>
    quarterSprints.reduce((s, sp) => s + getMemberAvailableDays(sp, memberId), 0);

  const handleCreateSprint = async () => {
    if (!sprintDraft.name.trim()) return;
    const d = toDate(sprintDraft.start_date);
    const quarter = d ? `Q${Math.floor(d.getMonth() / 3) + 1}` : null;
    const year = d ? String(d.getFullYear()) : null;
    await addSprint({ ...sprintDraft, working_days: Number(sprintDraft.working_days) || 10, quarter, year, team_id: activeTeamId });
    setSprintDraft(EMPTY_SPRINT);
    setCreatingSprint(false);
  };

  const saveEditor = async () => {
    if (!editor?.title.trim()) return;
    const payload = {
      title: editor.title,
      estimate_days: Number(editor.estimate_days) || 1,
      assignee_member_id: editor.assignee_member_id || null,
      roadmap_item_id: editor.roadmap_item_id || null,
      start_date: editor.start_date || null,
      sprint_id: sprintForDate(editor.start_date)?.id || null,
    };
    if (editor._new) {
      await addTask({ ...payload, team_id: activeTeamId });
    } else {
      await updateTask(editor.id, payload);
    }
    setEditor(null);
  };

  // Shared Gantt renderers (used by member rows and the unassigned backlog row).
  const renderGridlines = () => quarterSprints.map(s => {
    const x = pctBetween(toDate(s.end_date) || range.end, range.start, range.end);
    return <div key={s.id} className="gantt-gridline" style={{ right: `${x}%` }} />;
  });
  const renderBlock = (t) => {
    const d = effectiveStart(t);
    const left = pctBetween(d, range.start, range.end);
    const widthPct = Math.max(3, ((Number(t.estimate_days) || 1) * 86400000) / (range.end - range.start) * 100);
    const color = milestoneColor[t.roadmap_item_id] || '#64748B';
    return (
      <button key={t.id} className="gantt-block" title={`${t.title} · ${t.estimate_days}ד`}
        style={{ right: `${left}%`, width: `${Math.min(widthPct, 100 - left)}%`, background: color }}
        onClick={() => setEditor({ ...t, start_date: fmtDate(d), estimate_days: Number(t.estimate_days) || 1, roadmap_item_id: t.roadmap_item_id || '', assignee_member_id: t.assignee_member_id || '' })}>
        <span className="gantt-block-title">{t.title}</span>
      </button>
    );
  };
  const backlogTasks = quarterTasks.filter(t => !t.assignee_member_id);

  return (
    <div className="content-area animate-fade-in sprint-board-layout">
      <header className="page-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
          <p className="text-secondary text-sm">תכנון עומס הצוות מול היעדים הרבעוניים</p>
        </div>
        <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span className="badge badge-gray"><CalendarRange size={13} /> {activeQ.quarter} {activeQ.year}</span>
          <button className="btn btn-secondary" onClick={() => setCreatingSprint(v => !v)}>
            <Plus size={16} /> ספרינט חדש
          </button>
        </div>
      </header>

      {creatingSprint && (
        <div className="glass-panel sprint-form" style={{ direction: 'rtl' }}>
          <div className="field"><label>שם הספרינט</label>
            <input className="modal-input" value={sprintDraft.name} autoFocus
              onChange={e => setSprintDraft({ ...sprintDraft, name: e.target.value })} placeholder="לדוגמה: ספרינט 14" />
          </div>
          <div className="field"><label>תאריך התחלה</label>
            <input type="date" className="modal-input" value={sprintDraft.start_date}
              onChange={e => setSprintDraft({ ...sprintDraft, start_date: e.target.value })} />
          </div>
          <div className="field"><label>תאריך סיום</label>
            <input type="date" className="modal-input" value={sprintDraft.end_date}
              onChange={e => setSprintDraft({ ...sprintDraft, end_date: e.target.value })} />
          </div>
          <div className="field"><label>ימי עבודה לאדם</label>
            <input type="number" min="1" className="modal-input" value={sprintDraft.working_days}
              onChange={e => setSprintDraft({ ...sprintDraft, working_days: e.target.value })} />
          </div>
          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn-primary" onClick={handleCreateSprint}><Check size={16} /> צור</button>
            <button className="btn-icon" onClick={() => { setCreatingSprint(false); setSprintDraft(EMPTY_SPRINT); }}><X size={18} /></button>
          </div>
        </div>
      )}

      {quarterSprints.length === 0 ? (
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <CalendarRange size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין ספרינטים ברבעון</h3>
          <p className="text-secondary mb-4">צור ספרינטים עם תאריכים כדי לבנות את לוח התכנון הרבעוני.</p>
          <button className="btn btn-primary" onClick={() => setCreatingSprint(true)}><Plus size={16} /> צור ספרינט</button>
        </div>
      ) : (
        <>
          {/* Milestones (committed) + breakdown rail */}
          <div className="glass-panel requirements-panel" style={{ direction: 'rtl' }}>
            <div className="flex-center gap-2 mb-3" style={{ justifyContent: 'flex-start' }}>
              <span className="icon-badge bg-indigo"><Layers size={18} /></span>
              <span className="text-h3">אבני דרך מחויבות (PM)</span>
              <span className="badge badge-gray">{milestones.length}</span>
            </div>
            {milestones.length === 0 ? (
              <p className="text-tertiary text-sm" style={{ fontStyle: 'italic' }}>
                אין אבני דרך בציר הזמן לרבעון זה. ה-PM משבץ אותן ממפת הדרכים.
              </p>
            ) : (
              <div className="requirements-list">
                {milestones.map(item => (
                  <div key={item.id} className="requirement-row">
                    <div className="requirement-main">
                      <span className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        <span className="milestone-swatch" style={{ background: milestoneColor[item.id] }} />
                        <span className="requirement-title">{item.title}</span>
                      </span>
                      <span className="requirement-product">
                        {teamProducts.find(p => p.id === item.product_id)?.name || ''}
                        {' · '}{quarterTasks.filter(t => t.roadmap_item_id === item.id).length} משימות
                      </span>
                    </div>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setEditor({ ...newTaskTemplate('', fmtDate(range.start)), roadmap_item_id: item.id })}>
                      <Plus size={14} /> פרק למשימה
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task editor */}
          {editor && (
            <div className="glass-panel task-editor" style={{ direction: 'rtl' }}>
              <div className="field" style={{ flex: 2, minWidth: 180 }}><label>משימה</label>
                <input className="modal-input" value={editor.title} autoFocus
                  onChange={e => setEditor({ ...editor, title: e.target.value })} placeholder="כותרת המשימה" />
              </div>
              <div className="field"><label>אבן דרך</label>
                <select className="modal-input" value={editor.roadmap_item_id}
                  onChange={e => setEditor({ ...editor, roadmap_item_id: e.target.value })}>
                  <option value="">— ללא —</option>
                  {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="field"><label>אחראי</label>
                <select className="modal-input" value={editor.assignee_member_id}
                  onChange={e => setEditor({ ...editor, assignee_member_id: e.target.value })}>
                  <option value="">— ללא —</option>
                  {activeRoster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="field"><label>התחלה</label>
                <input type="date" className="modal-input" value={editor.start_date}
                  min={fmtDate(range.start)} max={fmtDate(range.end)}
                  onChange={e => setEditor({ ...editor, start_date: e.target.value })} />
              </div>
              <div className="field" style={{ maxWidth: 110 }}><label>אומדן (ימים)</label>
                <select className="modal-input" value={editor.estimate_days}
                  onChange={e => setEditor({ ...editor, estimate_days: parseFloat(e.target.value) })}>
                  {ESTIMATE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-center gap-2" style={{ alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={saveEditor}><Check size={16} /> שמירה</button>
                {!editor._new && <button className="btn-icon text-danger" onClick={() => { deleteTask(editor.id); setEditor(null); }}><Trash2 size={16} /></button>}
                <button className="btn-icon" onClick={() => setEditor(null)}><X size={18} /></button>
              </div>
            </div>
          )}

          {/* Gantt */}
          <div className="glass-panel gantt" style={{ direction: 'rtl' }}>
            {/* Header: months + sprint bands */}
            <div className="gantt-header">
              <div className="gantt-label-col text-xs text-tertiary">צוות \ זמן</div>
              <div className="gantt-track">
                <div className="gantt-months">
                  {(MONTHS_BY_Q[activeQ.quarter] || []).map((mname, i) => (
                    <div key={i} className="gantt-month">{mname}</div>
                  ))}
                </div>
                <div className="gantt-sprint-bands">
                  {quarterSprints.map(s => {
                    const left = pctBetween(toDate(s.start_date) || range.start, range.start, range.end);
                    const right = pctBetween(toDate(s.end_date) || range.end, range.start, range.end);
                    return (
                      <div key={s.id} className="gantt-sprint-band" style={{ right: `${left}%`, width: `${Math.max(2, right - left)}%` }}
                        title={`${s.name} · ${s.start_date || ''}–${s.end_date || ''}`}>
                        <span>{s.name}</span>
                        <button className="gantt-band-del" onClick={() => { if (window.confirm('למחוק את הספרינט?')) deleteSprint(s.id); }}><X size={11} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Member rows */}
            <div className="gantt-body">
              {activeRoster.length === 0 && (
                <p className="text-tertiary text-sm" style={{ padding: '1rem', fontStyle: 'italic' }}>אין אנשי צוות פעילים.</p>
              )}
              {activeRoster.map(member => {
                const load = memberQuarterLoad(member.id);
                const cap = memberQuarterCapacity(member.id);
                const over = cap && load > cap;
                const tasks = quarterTasks.filter(t => t.assignee_member_id === member.id);
                return (
                  <div key={member.id} className="gantt-row">
                    <div className="gantt-label-col">
                      <span className="gantt-member-name">{member.name}</span>
                      <span className={`gantt-member-cap ${over ? 'is-over' : ''}`}>{load}/{cap}ד</span>
                    </div>
                    <div className="gantt-track gantt-row-track">
                      {renderGridlines()}
                      {/* per-sprint overload tint */}
                      {quarterSprints.map(s => {
                        const a = pctBetween(toDate(s.start_date) || range.start, range.start, range.end);
                        const b = pctBetween(toDate(s.end_date) || range.end, range.start, range.end);
                        const ml = memberSprintLoad(member.id, s);
                        const av = getMemberAvailableDays(s, member.id);
                        if (!av || ml <= av) return null;
                        return <div key={s.id} className="gantt-overload" style={{ right: `${a}%`, width: `${Math.max(2, b - a)}%` }} title={`עומס יתר: ${ml}/${av} ימים`} />;
                      })}
                      {tasks.map(renderBlock)}
                      <button className="gantt-add-inline" title="הוסף משימה"
                        onClick={() => setEditor(newTaskTemplate(member.id, fmtDate(quarterSprints[0]?.start_date || range.start)))}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Unassigned backlog — tasks with no assignee, editable here */}
              <div className="gantt-row gantt-row-backlog">
                <div className="gantt-label-col">
                  <span className="gantt-member-name">ללא שיוך</span>
                  <span className="gantt-member-cap">{backlogTasks.length} · {backlogTasks.reduce((s, t) => s + (Number(t.estimate_days) || 0), 0)}ד</span>
                </div>
                <div className="gantt-track gantt-row-track">
                  {renderGridlines()}
                  {backlogTasks.map(renderBlock)}
                  <button className="gantt-add-inline" title="הוסף משימה ללא שיוך"
                    onClick={() => setEditor(newTaskTemplate('', fmtDate(quarterSprints[0]?.start_date || range.start)))}>
                    <Plus size={13} />
                  </button>
                  {backlogTasks.length === 0 && (
                    <span className="gantt-backlog-empty text-tertiary text-xs">אין משימות ללא שיוך</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SprintBoard;
