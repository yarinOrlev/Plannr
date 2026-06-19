import React, { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import {
  CalendarRange, Plus, Trash2, Check, X, Pencil, Users, ChevronDown, ChevronRight,
  Layers, GitBranch,
} from 'lucide-react';
import './SprintBoard.css';

const TASK_COLUMNS = [
  { key: 'Todo', label: 'לביצוע', color: 'gray' },
  { key: 'InProgress', label: 'בתהליך', color: 'blue' },
  { key: 'Done', label: 'הושלם', color: 'green' },
  { key: 'Blocked', label: 'חסום', color: 'red' },
];

const ESTIMATE_OPTIONS = [0.5, 1, 2, 3, 5, 8];

const quarterOf = (dateStr) => {
  if (!dateStr) return { quarter: null, year: null };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { quarter: null, year: null };
  return { quarter: `Q${Math.floor(d.getMonth() / 3) + 1}`, year: String(d.getFullYear()) };
};

const meterColor = (load, capacity) => {
  if (!capacity) return 'gray';
  const ratio = load / capacity;
  if (ratio > 1) return 'red';
  if (ratio > 0.9) return 'amber';
  return 'green';
};

// ── Capacity bar ────────────────────────────────────────────────────────────
const CapacityMeter = ({ load, capacity, label }) => {
  const color = meterColor(load, capacity);
  const pct = capacity ? Math.min(100, (load / capacity) * 100) : 0;
  return (
    <div className="capacity-meter">
      <div className="capacity-meter-head">
        <span className="capacity-meter-label">{label}</span>
        <span className={`capacity-meter-value text-${color}`}>
          {load} / {capacity} ימים
        </span>
      </div>
      <div className="capacity-meter-track">
        <div className={`capacity-meter-fill fill-${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const EMPTY_SPRINT = { name: '', start_date: '', end_date: '', working_days: 10, goal: '' };

const SprintBoard = () => {
  const {
    activeTeamId, teamSprints, teamRoster, teamTasks,
    addSprint, deleteSprint,
    addTask, updateTask, deleteTask,
    setMemberAvailability, getMemberAvailableDays, getSprintLoad, getSprintCapacity,
    teamProducts, teamRoadmapItems, getRoadmapItemProgress, createTasksFromRoadmapItem,
  } = useProductContext();

  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [sprintDraft, setSprintDraft] = useState(EMPTY_SPRINT);
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);

  const [addingCol, setAddingCol] = useState(null);
  const [taskDraft, setTaskDraft] = useState({ title: '', estimate_days: 1, assignee_member_id: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskEdit, setTaskEdit] = useState({ title: '', estimate_days: 1 });

  const [showRequirements, setShowRequirements] = useState(true);
  const [breakingItemId, setBreakingItemId] = useState(null);
  const [breakdownDrafts, setBreakdownDrafts] = useState([]);

  // Default the selected sprint to the latest one once data is available.
  const activeSprint = useMemo(() => {
    if (!teamSprints.length) return null;
    return teamSprints.find(s => s.id === selectedSprintId) || teamSprints[teamSprints.length - 1];
  }, [teamSprints, selectedSprintId]);

  const sprintTasks = useMemo(
    () => teamTasks.filter(t => t.sprint_id === activeSprint?.id),
    [teamTasks, activeSprint],
  );

  const activeRoster = teamRoster.filter(m => m.active);
  const memberName = (id) => teamRoster.find(m => m.id === id)?.name || 'ללא שיוך';

  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header">
          <div>
            <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
            <p className="text-secondary text-lg">חלוקת עבודה לפי קיבולת הצוות</p>
          </div>
        </header>
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <Users size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין צוות עדיין</h3>
          <p className="text-secondary">צור צוות והוסף אנשים במסך "צוות וקיבולת" כדי להתחיל לתכנן ספרינטים.</p>
        </div>
      </div>
    );
  }

  const handleCreateSprint = async () => {
    if (!sprintDraft.name.trim()) return;
    const { quarter, year } = quarterOf(sprintDraft.start_date);
    const res = await addSprint({
      ...sprintDraft,
      working_days: Number(sprintDraft.working_days) || 10,
      quarter, year,
      team_id: activeTeamId,
    });
    if (res?.data) setSelectedSprintId(res.data.id);
    setSprintDraft(EMPTY_SPRINT);
    setCreatingSprint(false);
  };

  const handleAddTask = async (status) => {
    if (!taskDraft.title.trim()) return;
    await addTask({
      title: taskDraft.title,
      estimate_days: Number(taskDraft.estimate_days) || 1,
      assignee_member_id: taskDraft.assignee_member_id || null,
      status,
      team_id: activeTeamId,
      sprint_id: activeSprint.id,
    });
    setTaskDraft({ title: '', estimate_days: 1, assignee_member_id: '' });
    setAddingCol(null);
  };

  const saveTaskEdit = async () => {
    if (!taskEdit.title.trim()) return;
    await updateTask(editingTaskId, {
      title: taskEdit.title,
      estimate_days: Number(taskEdit.estimate_days) || 1,
    });
    setEditingTaskId(null);
  };

  // Per-assignee load within the active sprint.
  const loadByMember = (memberId) =>
    sprintTasks
      .filter(t => t.assignee_member_id === memberId)
      .reduce((sum, t) => sum + (Number(t.estimate_days) || 0), 0);

  const productName = (id) => teamProducts.find(p => p.id === id)?.name || '';

  // ── Breaking a PM roadmap item into tasks ──
  const startBreakdown = (itemId) => {
    setBreakingItemId(itemId);
    setBreakdownDrafts([{ title: '', estimate_days: 1, assignee_member_id: '' }]);
  };
  const updateDraft = (i, patch) =>
    setBreakdownDrafts(drafts => drafts.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const addDraftRow = () =>
    setBreakdownDrafts(drafts => [...drafts, { title: '', estimate_days: 1, assignee_member_id: '' }]);
  const removeDraftRow = (i) =>
    setBreakdownDrafts(drafts => drafts.filter((_, idx) => idx !== i));
  const confirmBreakdown = async () => {
    const valid = breakdownDrafts.filter(d => d.title.trim());
    if (!valid.length) return;
    await createTasksFromRoadmapItem(
      breakingItemId,
      activeTeamId,
      valid.map(d => ({ ...d, estimate_days: Number(d.estimate_days) || 1, sprint_id: activeSprint.id })),
    );
    setBreakingItemId(null);
    setBreakdownDrafts([]);
  };

  return (
    <div className="content-area animate-fade-in sprint-board-layout">
      <header className="page-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
          <p className="text-secondary text-sm">חלוקת עבודה לפי קיבולת הצוות</p>
        </div>
        <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
          {teamSprints.length > 0 && (
            <select className="modal-input" style={{ width: 200, height: 38 }}
              value={activeSprint?.id || ''} onChange={e => setSelectedSprintId(e.target.value)}>
              {teamSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
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
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>מטרת הספרינט</label>
            <input className="modal-input" value={sprintDraft.goal}
              onChange={e => setSprintDraft({ ...sprintDraft, goal: e.target.value })} placeholder="מה רוצים להשיג?" />
          </div>
          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn-primary" onClick={handleCreateSprint}><Check size={16} /> צור</button>
            <button className="btn-icon" onClick={() => { setCreatingSprint(false); setSprintDraft(EMPTY_SPRINT); }}><X size={18} /></button>
          </div>
        </div>
      )}

      {!activeSprint ? (
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <CalendarRange size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין ספרינטים</h3>
          <p className="text-secondary mb-4">צור ספרינט ראשון כדי להתחיל לתכנן את עבודת הצוות.</p>
          <button className="btn btn-primary" onClick={() => setCreatingSprint(true)}>
            <Plus size={16} /> צור ספרינט
          </button>
        </div>
      ) : (
        <>
          {/* Sprint header + capacity */}
          <div className="glass-panel sprint-summary" style={{ direction: 'rtl' }}>
            <div className="sprint-summary-head">
              <div>
                <h3 className="text-h3">{activeSprint.name}</h3>
                {activeSprint.goal && <p className="text-secondary text-sm mt-2">{activeSprint.goal}</p>}
                <p className="text-tertiary text-xs mt-2">
                  {activeSprint.start_date || '—'} → {activeSprint.end_date || '—'} · {activeSprint.working_days} ימי עבודה
                </p>
              </div>
              <div className="flex-center gap-2">
                <button className="btn-icon text-danger" title="מחק ספרינט"
                  onClick={() => { if (window.confirm('למחוק את הספרינט? המשימות יחזרו ל-Backlog.')) deleteSprint(activeSprint.id); }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <CapacityMeter
              load={getSprintLoad(activeSprint.id)}
              capacity={getSprintCapacity(activeSprint.id)}
              label="עומס הספרינט מול קיבולת"
            />

            <button className="capacity-toggle" onClick={() => setShowCapacityPanel(v => !v)}>
              {showCapacityPanel ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              קיבולת לפי אדם וזמינות (PTO)
            </button>

            {showCapacityPanel && (
              <div className="member-capacity-grid">
                {activeRoster.length === 0 && (
                  <p className="text-tertiary text-xs italic">אין אנשי צוות פעילים. הוסף אותם ב"צוות וקיבולת".</p>
                )}
                {activeRoster.map(m => {
                  const available = getMemberAvailableDays(activeSprint, m.id);
                  const load = loadByMember(m.id);
                  return (
                    <div key={m.id} className="member-capacity-row">
                      <span className="member-capacity-name">{m.name}</span>
                      <CapacityMeter load={load} capacity={available} label="" />
                      <div className="member-capacity-edit">
                        <label className="text-[10px] text-tertiary">זמינות (ימים)</label>
                        <input type="number" min="0" className="modal-input" style={{ width: 70, height: 30 }}
                          defaultValue={available}
                          onBlur={e => setMemberAvailability(activeSprint.id, m.id, Number(e.target.value) || 0)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PM requirements rail — break roadmap items into sprint tasks */}
          <div className="glass-panel requirements-panel" style={{ direction: 'rtl' }}>
            <button className="requirements-head" onClick={() => setShowRequirements(v => !v)}>
              <span className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                <span className="icon-badge bg-indigo"><Layers size={18} /></span>
                <span className="text-h3">דרישות מוצר (PM)</span>
                <span className="badge badge-gray">{teamRoadmapItems.length}</span>
              </span>
              {showRequirements ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {showRequirements && (
              <div className="requirements-list">
                {teamRoadmapItems.length === 0 && (
                  <p className="text-tertiary text-sm" style={{ padding: '0.5rem 0', fontStyle: 'italic' }}>
                    אין דרישות. פריטי מפת הדרכים של מוצרי הצוות יופיעו כאן.
                  </p>
                )}
                {teamRoadmapItems.map(item => {
                  const prog = getRoadmapItemProgress(item.id);
                  const isBreaking = breakingItemId === item.id;
                  return (
                    <div key={item.id} className="requirement-row">
                      <div className="requirement-main">
                        <span className="requirement-title">{item.title}</span>
                        <span className="requirement-product">{productName(item.product_id)}</span>
                      </div>
                      <div className="flex-center gap-2">
                        {prog.total > 0 && (
                          <span className="badge badge-blue">{prog.done}/{prog.total} · {prog.days}ד</span>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => isBreaking ? setBreakingItemId(null) : startBreakdown(item.id)}>
                          <GitBranch size={14} /> פרק למשימות
                        </button>
                      </div>

                      {isBreaking && (
                        <div className="breakdown-form">
                          {breakdownDrafts.map((d, i) => (
                            <div key={i} className="breakdown-row">
                              <input className="modal-input" placeholder="כותרת המשימה..." value={d.title} autoFocus={i === 0}
                                onChange={e => updateDraft(i, { title: e.target.value })} />
                              <select className="modal-input" style={{ width: 110, height: 36 }} value={d.estimate_days}
                                onChange={e => updateDraft(i, { estimate_days: parseFloat(e.target.value) })}>
                                {ESTIMATE_OPTIONS.map(v => <option key={v} value={v}>{v} ימים</option>)}
                              </select>
                              <select className="modal-input" style={{ width: 130, height: 36 }} value={d.assignee_member_id}
                                onChange={e => updateDraft(i, { assignee_member_id: e.target.value })}>
                                <option value="">ללא שיוך</option>
                                {activeRoster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                              <button className="btn-icon" onClick={() => removeDraftRow(i)} title="הסר"
                                disabled={breakdownDrafts.length === 1} style={{ opacity: breakdownDrafts.length === 1 ? 0.3 : 1 }}>
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                            <button className="btn btn-ghost btn-sm" onClick={addDraftRow}><Plus size={14} /> עוד משימה</button>
                            <div style={{ flex: 1 }} />
                            <button className="btn btn-primary btn-sm" onClick={confirmBreakdown}>
                              <Check size={14} /> צור בספרינט "{activeSprint.name}"
                            </button>
                            <button className="btn-icon" onClick={() => setBreakingItemId(null)}><X size={16} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Task board */}
          <div className="task-board">
            {TASK_COLUMNS.map(col => {
              const items = sprintTasks.filter(t => (t.status || 'Todo') === col.key);
              const colDays = items.reduce((s, t) => s + (Number(t.estimate_days) || 0), 0);
              return (
                <div key={col.key} className="task-column glass-panel">
                  <div className="task-column-head">
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <span className={`task-col-dot bg-${col.color}`} />
                      <h4 className="font-semibold text-sm">{col.label}</h4>
                    </div>
                    <span className="badge">{items.length} · {colDays}ד</span>
                  </div>

                  <div className="task-cards">
                    {items.map(t => (
                      editingTaskId === t.id ? (
                        <div key={t.id} className="task-edit-form" style={{ direction: 'rtl' }}>
                          <input className="modal-input" value={taskEdit.title} autoFocus
                            onChange={e => setTaskEdit({ ...taskEdit, title: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') saveTaskEdit(); if (e.key === 'Escape') setEditingTaskId(null); }} />
                          <div className="flex-center gap-2 mt-2" style={{ justifyContent: 'flex-start' }}>
                            <select className="modal-input" style={{ height: 32 }} value={taskEdit.estimate_days}
                              onChange={e => setTaskEdit({ ...taskEdit, estimate_days: parseFloat(e.target.value) })}>
                              {ESTIMATE_OPTIONS.map(v => <option key={v} value={v}>{v} ימים</option>)}
                            </select>
                            <button className="btn btn-primary" style={{ height: 32, padding: '0 0.6rem' }} onClick={saveTaskEdit}><Check size={14} /></button>
                            <button className="btn-icon" onClick={() => setEditingTaskId(null)}><X size={16} /></button>
                          </div>
                        </div>
                      ) : (
                        <div key={t.id} className="task-card" style={{ direction: 'rtl' }}>
                          <div className="task-card-head">
                            <span className="task-title">{t.title}</span>
                            <div className="task-card-actions">
                              <button className="btn-icon-xs" title="עריכה"
                                onClick={() => { setEditingTaskId(t.id); setTaskEdit({ title: t.title, estimate_days: Number(t.estimate_days) || 1 }); }}>
                                <Pencil size={13} />
                              </button>
                              <button className="btn-icon-xs text-danger" title="מחיקה" onClick={() => deleteTask(t.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="task-card-meta">
                            <span className="estimate-pill">{Number(t.estimate_days) || 0} ימים</span>
                            <select className="task-assignee" value={t.assignee_member_id || ''}
                              onChange={e => updateTask(t.id, { assignee_member_id: e.target.value || null })}
                              title="שיוך">
                              <option value="">— ללא שיוך —</option>
                              {activeRoster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <select className="task-status" value={t.status || 'Todo'}
                            onChange={e => updateTask(t.id, { status: e.target.value })} title="סטטוס">
                            {TASK_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                          {t.assignee_member_id && (
                            <span className="task-assignee-chip">{memberName(t.assignee_member_id)}</span>
                          )}
                        </div>
                      )
                    ))}

                    {addingCol === col.key ? (
                      <div className="task-add-form" style={{ direction: 'rtl' }}>
                        <input className="modal-input" placeholder="כותרת המשימה..." value={taskDraft.title} autoFocus
                          onChange={e => setTaskDraft({ ...taskDraft, title: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.key); if (e.key === 'Escape') setAddingCol(null); }} />
                        <div className="flex-center gap-2 mt-2">
                          <select className="modal-input" style={{ height: 32 }} value={taskDraft.estimate_days}
                            onChange={e => setTaskDraft({ ...taskDraft, estimate_days: parseFloat(e.target.value) })}>
                            {ESTIMATE_OPTIONS.map(v => <option key={v} value={v}>{v} ימים</option>)}
                          </select>
                          <select className="modal-input" style={{ height: 32 }} value={taskDraft.assignee_member_id}
                            onChange={e => setTaskDraft({ ...taskDraft, assignee_member_id: e.target.value })}>
                            <option value="">ללא שיוך</option>
                            {activeRoster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                        <div className="flex-center gap-2 mt-2">
                          <button className="btn btn-primary" style={{ flex: 1, height: 32 }} onClick={() => handleAddTask(col.key)}><Check size={14} /> הוספה</button>
                          <button className="btn-icon" onClick={() => setAddingCol(null)}><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <button className="add-task-btn" onClick={() => { setTaskDraft({ title: '', estimate_days: 1, assignee_member_id: '' }); setAddingCol(col.key); }}>
                        <Plus size={14} /> משימה
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SprintBoard;
