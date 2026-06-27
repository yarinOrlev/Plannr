import React, { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import {
  CalendarRange, Plus, Trash2, Check, X, Users, Target,
  ListTodo, ChevronDown, ChevronRight, Search, Clock,
  GitPullRequest, UserCheck, ArrowLeft, Zap,
} from 'lucide-react';
import './SprintBoard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPLEXITY_CONFIG = {
  XS: { color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7', desc: 'כמה שעות' },
  S:  { color: '#3B82F6', bg: '#DBEAFE', border: '#93C5FD', desc: '1–2 ימים' },
  M:  { color: '#F59E0B', bg: '#FEF3C7', border: '#FCD34D', desc: '3–5 ימים' },
  L:  { color: '#F97316', bg: '#FFEDD5', border: '#FDBA74', desc: 'שבוע–שבועיים' },
  XL: { color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5', desc: 'מעל שבועיים' },
};

const STATUS_CONFIG = {
  'Todo':        { label: 'ממתין',  dot: '#9CA3AF' },
  'In Progress': { label: 'בעבודה', dot: '#3B82F6' },
  'In CR':       { label: 'בסקירה', dot: '#8B5CF6' },
  'Done':        { label: 'הושלם',  dot: '#10B981' },
  'Blocked':     { label: 'חסום',   dot: '#EF4444' },
};

const EMPTY_SPRINT = { name: '', goal: '', start_date: '', end_date: '', working_days: 10 };

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const ComplexityBadge = ({ complexity = 'M' }) => {
  const cfg = COMPLEXITY_CONFIG[complexity] || COMPLEXITY_CONFIG['M'];
  return (
    <span style={{
      display: 'inline-block', padding: '0.12rem 0.5rem', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: '700',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {complexity}
    </span>
  );
};

const StatusSelect = ({ value, onChange }) => (
  <select className="sb-select sb-status-select" value={value || 'Todo'} onChange={e => onChange(e.target.value)}>
    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
      <option key={k} value={k}>{v.label}</option>
    ))}
  </select>
);

const MemberSelect = ({ value, roster, onChange, placeholder = '—' }) => (
  <select className="sb-select" value={value || ''} onChange={e => onChange(e.target.value || null)}>
    <option value="">{placeholder}</option>
    {roster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
  </select>
);

// ─── Sprint mission row ───────────────────────────────────────────────────────
const SprintMissionRow = ({ task, feature, objective, roster, updateFeatureTask, onRemove }) => {
  const upd = (field, val) => updateFeatureTask(task.id, { [field]: val });

  return (
    <tr className="sb-mission-row">
      <td className="sb-mission-title-cell">
        <div className="sb-mission-hierarchy">
          {objective && (
            <span className="sb-mission-obj">
              <Target size={9} style={{ display: 'inline', marginLeft: 2 }} />
              {objective.title}
            </span>
          )}
          {feature && <span className="sb-mission-feature">{feature.title}</span>}
          <span className="sb-mission-task">{task.title}</span>
        </div>
        {task.description && <p className="sb-mission-desc">{task.description}</p>}
      </td>
      <td className="text-center">
        <ComplexityBadge complexity={task.complexity || 'M'} />
      </td>
      <td className="text-center sb-hours-cell">
        {task.estimate_hours > 0 ? `${task.estimate_hours}ש'` : '—'}
      </td>
      <td>
        <MemberSelect value={task.assignee_member_id} roster={roster}
          onChange={v => upd('assignee_member_id', v)} placeholder="אחראי" />
      </td>
      <td>
        <MemberSelect value={task.cr_reviewer_1_id} roster={roster}
          onChange={v => upd('cr_reviewer_1_id', v)} placeholder="CR 1" />
      </td>
      <td>
        <MemberSelect value={task.cr_reviewer_2_id} roster={roster}
          onChange={v => upd('cr_reviewer_2_id', v)} placeholder="CR 2" />
      </td>
      <td>
        <StatusSelect value={task.status} onChange={v => upd('status', v)} />
      </td>
      <td>
        <button className="btn-icon-xs text-danger" onClick={() => onRemove(task.id)} title="הסר מספרינט">
          <X size={13} />
        </button>
      </td>
    </tr>
  );
};

// ─── Sprint card ──────────────────────────────────────────────────────────────
const SprintCard = ({ sprint, missions, features, objectives, roster, deleteSprint, updateFeatureTask }) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalHours  = missions.reduce((s, t) => s + (Number(t.estimate_hours) || 0), 0);
  const doneCount   = missions.filter(t => t.status === 'Done').length;
  const inCrCount   = missions.filter(t => t.status === 'In CR').length;
  const inProgCount = missions.filter(t => t.status === 'In Progress').length;
  const progressPct = missions.length ? Math.round((doneCount / missions.length) * 100) : 0;

  const removeMission = (taskId) =>
    updateFeatureTask(taskId, { sprint_id: null, assignee_member_id: null, cr_reviewer_1_id: null, cr_reviewer_2_id: null });

  return (
    <div className="sb-sprint-card glass-panel">
      {/* Header */}
      <div className="sb-sprint-header" onClick={() => setCollapsed(v => !v)}>
        <div className="sb-sprint-header-left">
          <span className="sb-expand-btn">
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </span>
          <div className="sb-sprint-name-block">
            <span className="sb-sprint-name">{sprint.name}</span>
            {sprint.goal && <span className="sb-sprint-goal">{sprint.goal}</span>}
          </div>
        </div>
        <div className="sb-sprint-header-right">
          {(sprint.start_date || sprint.end_date) && (
            <span className="sb-sprint-dates">
              <CalendarRange size={12} />
              {fmtDate(sprint.start_date)}{sprint.end_date ? ` – ${fmtDate(sprint.end_date)}` : ''}
              {sprint.working_days && <span className="sb-sprint-workdays"> · {sprint.working_days}ד/אדם</span>}
            </span>
          )}
          <div className="sb-sprint-chips">
            <span className="sb-chip sb-chip-neutral">{missions.length} משימות</span>
            {totalHours > 0 && <span className="sb-chip sb-chip-indigo"><Clock size={10} /> {totalHours}ש'</span>}
            {inProgCount > 0 && <span className="sb-chip sb-chip-blue">{inProgCount} בעבודה</span>}
            {inCrCount > 0 && <span className="sb-chip sb-chip-purple"><GitPullRequest size={10} /> {inCrCount}</span>}
            {doneCount > 0 && <span className="sb-chip sb-chip-green"><Check size={10} /> {doneCount}</span>}
          </div>
          <button className="btn-icon-xs text-danger"
            onClick={e => { e.stopPropagation(); if (window.confirm(`למחוק את "${sprint.name}"?`)) deleteSprint(sprint.id); }}
            title="מחק ספרינט"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Progress bar */}
      {missions.length > 0 && (
        <div className="sb-progress-bar">
          <div className="sb-progress-fill" style={{ width: `${progressPct}%` }} title={`${progressPct}% הושלם`} />
        </div>
      )}

      {/* Mission list */}
      {!collapsed && (
        <div className="sb-missions-body">
          {missions.length === 0 ? (
            <div className="sb-empty-missions">
              <ListTodo size={28} className="opacity-20" />
              <span>הוסף משימות מבריכת המשימות שמימין</span>
              <span className="sb-empty-hint">בחר ספרינט יעד בבריכה ולחץ על משימה להוספה</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="sb-missions-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right', minWidth: 220 }}>משימה</th>
                    <th style={{ minWidth: 70 }}>מורכבות</th>
                    <th style={{ minWidth: 55 }}>שעות</th>
                    <th style={{ minWidth: 120 }}>
                      <span className="sb-col-icon"><UserCheck size={12} /> אחראי</span>
                    </th>
                    <th style={{ minWidth: 110 }}>
                      <span className="sb-col-icon"><GitPullRequest size={12} /> CR 1</span>
                    </th>
                    <th style={{ minWidth: 110 }}>
                      <span className="sb-col-icon"><GitPullRequest size={12} /> CR 2</span>
                    </th>
                    <th style={{ minWidth: 100 }}>סטטוס</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map(task => {
                    const feature   = features.find(f => f.id === task.feature_id);
                    const objective = objectives.find(o => o.id === feature?.objective_id);
                    return (
                      <SprintMissionRow key={task.id}
                        task={task} feature={feature} objective={objective}
                        roster={roster} updateFeatureTask={updateFeatureTask}
                        onRemove={removeMission} />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Pool task item ───────────────────────────────────────────────────────────
const PoolTaskItem = ({ task, feature, objective, onAssign, disabled }) => (
  <div className={`pool-task-row ${disabled ? 'pool-task-row--disabled' : ''}`}
    onClick={() => !disabled && onAssign(task.id)}
    title={disabled ? 'בחר ספרינט יעד תחילה' : `הוסף לספרינט`}>
    <button className="pool-add-btn" disabled={disabled}>
      <Plus size={11} />
    </button>
    <div className="pool-task-info">
      {objective && <span className="pool-task-obj">{objective.title}</span>}
      {feature && <span className="pool-task-feature">{feature.title}</span>}
      <span className="pool-task-title">{task.title}</span>
      {task.description && <span className="pool-task-desc">{task.description}</span>}
    </div>
    <div className="pool-task-meta">
      <ComplexityBadge complexity={task.complexity || 'M'} />
      {task.estimate_hours > 0 && <span className="pool-task-hours">{task.estimate_hours}ש'</span>}
    </div>
  </div>
);

// ─── Mission pool sidebar ─────────────────────────────────────────────────────
const MissionPool = ({ tasks, features, objectives, quarterSprints, updateFeatureTask }) => {
  const [targetSprintId, setTargetSprintId] = useState('');
  const [search, setSearch] = useState('');

  const unassigned = tasks.filter(t => !t.sprint_id);

  const filtered = useMemo(() => {
    if (!search) return unassigned;
    const q = search.toLowerCase();
    return unassigned.filter(t => {
      const feat = features.find(f => f.id === t.feature_id);
      return t.title.toLowerCase().includes(q) ||
        feat?.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q);
    });
  }, [unassigned, features, search]);

  // Group: objective → feature → tasks
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach(task => {
      const feat  = features.find(f => f.id === task.feature_id);
      const objId = feat?.objective_id || '__none__';
      if (!map.has(objId)) map.set(objId, new Map());
      const fMap = map.get(objId);
      if (!fMap.has(task.feature_id)) fMap.set(task.feature_id, []);
      fMap.get(task.feature_id).push(task);
    });
    return map;
  }, [filtered, features]);

  const handleAssign = (taskId) => {
    if (!targetSprintId) return;
    updateFeatureTask(taskId, { sprint_id: targetSprintId });
  };

  return (
    <div className="mission-pool glass-panel">
      <div className="pool-header">
        <div className="pool-title">
          <ListTodo size={15} />
          <span>בריכת משימות</span>
        </div>
        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{unassigned.length}</span>
      </div>

      <div className="pool-controls">
        <div className="pool-sprint-selector">
          <label className="pool-ctrl-label">הוסף ל:</label>
          <select className="premium-input" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
            value={targetSprintId} onChange={e => setTargetSprintId(e.target.value)}>
            <option value="">— בחר ספרינט —</option>
            {quarterSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="pool-search-wrap">
          <Search size={13} className="pool-search-icon" />
          <input className="pool-search-input" placeholder="חפש משימה..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {!targetSprintId && (
        <div className="pool-notice">
          <ArrowLeft size={13} />
          <span>בחר ספרינט יעד כדי להוסיף משימות</span>
        </div>
      )}

      <div className="pool-list">
        {filtered.length === 0 && (
          <div className="pool-empty">
            {unassigned.length === 0 ? (
              <>
                <Check size={22} className="opacity-20" />
                <span>כל המשימות שויכו לספרינטים</span>
              </>
            ) : (
              <>
                <Search size={22} className="opacity-20" />
                <span>לא נמצאו תוצאות</span>
              </>
            )}
          </div>
        )}

        {[...groups.entries()].map(([objId, featureMap]) => {
          const obj = objectives.find(o => o.id === objId);
          return (
            <div key={objId} className="pool-obj-group">
              <div className="pool-obj-header">
                <Target size={11} />
                <span>{obj?.title || 'ללא יעד'}</span>
              </div>
              {[...featureMap.entries()].map(([fId, fTasks]) => {
                const feature = features.find(f => f.id === fId);
                return (
                  <div key={fId} className="pool-feature-group">
                    <div className="pool-feature-header">
                      <Zap size={10} style={{ opacity: 0.5 }} />
                      <span>{feature?.title || 'פיצ\'ר לא ידוע'}</span>
                    </div>
                    {fTasks.map(task => (
                      <PoolTaskItem key={task.id}
                        task={task} feature={feature} objective={obj}
                        onAssign={handleAssign}
                        disabled={!targetSprintId} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Sprint create form ───────────────────────────────────────────────────────
const SprintCreateForm = ({ onSave, onCancel }) => {
  const [draft, setDraft] = useState(EMPTY_SPRINT);
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div className="glass-panel sb-create-form animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="flex-between mb-4">
        <h3 className="text-h3">ספרינט חדש</h3>
        <button className="btn-icon" onClick={onCancel}><X size={18} /></button>
      </div>
      <div className="sb-form-grid">
        <div className="sb-field" style={{ gridColumn: '1 / 3' }}>
          <label>שם הספרינט *</label>
          <input className="premium-input" autoFocus value={draft.name}
            onChange={e => set('name', e.target.value)} placeholder="לדוגמה: ספרינט 15" />
        </div>
        <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
          <label>מטרת הספרינט</label>
          <input className="premium-input" value={draft.goal}
            onChange={e => set('goal', e.target.value)}
            placeholder="מה נרצה להשיג בסוף הספרינט? (לדוגמה: השלמת תשתית ה-auth)" />
        </div>
        <div className="sb-field">
          <label>תאריך התחלה</label>
          <input type="date" className="premium-input" value={draft.start_date}
            onChange={e => set('start_date', e.target.value)} />
        </div>
        <div className="sb-field">
          <label>תאריך סיום</label>
          <input type="date" className="premium-input" value={draft.end_date}
            onChange={e => set('end_date', e.target.value)} />
        </div>
        <div className="sb-field">
          <label>ימי עבודה לאדם</label>
          <input type="number" min="1" max="30" className="premium-input"
            value={draft.working_days} onChange={e => set('working_days', e.target.value)} />
        </div>
      </div>
      <div className="modal-footer-premium mt-4">
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => draft.name.trim() && onSave(draft)}>
          <Check size={16} /> צור ספרינט
        </button>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const SprintBoard = () => {
  const {
    activeTeamId, teamSprints, teamRoster,
    addSprint, deleteSprint, activeQuarter,
    featureTasks, updateFeatureTask,
    activeFeatures, activeObjectives, selectedProductIds,
  } = useProductContext();

  const [creatingSprint, setCreatingSprint] = useState(false);

  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header">
          <div>
            <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
            <p className="text-secondary text-lg">שייך משימות לספרינטים, הגדר אחראים וסוקרי קוד</p>
          </div>
        </header>
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <Users size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין צוות עדיין</h3>
          <p className="text-secondary">צור צוות והוסף אנשים במסך "צוות וקיבולת" כדי להתחיל לתכנן.</p>
        </div>
      </div>
    );
  }

  const activeQ    = activeQuarter;
  const activeRoster = teamRoster.filter(m => m.active);

  const quarterSprints = useMemo(() =>
    teamSprints
      .filter(s => s.quarter === activeQ.quarter && String(s.year) === String(activeQ.year))
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')),
    [teamSprints, activeQ.quarter, activeQ.year]);

  // Feature tasks scoped to currently selected products
  const productFeatureTasks = useMemo(() =>
    featureTasks.filter(t => !t.product_id || selectedProductIds.includes(t.product_id)),
    [featureTasks, selectedProductIds]);

  const sprintMissions = (sprintId) =>
    productFeatureTasks.filter(t => t.sprint_id === sprintId);

  const handleCreateSprint = async (draft) => {
    const d = draft.start_date ? new Date(draft.start_date) : null;
    const quarter = d ? `Q${Math.floor(d.getMonth() / 3) + 1}` : activeQ.quarter;
    const year    = d ? String(d.getFullYear()) : activeQ.year;
    await addSprint({ ...draft, working_days: Number(draft.working_days) || 10, quarter, year, team_id: activeTeamId });
    setCreatingSprint(false);
  };

  return (
    <div className="content-area animate-fade-in sb-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
          <p className="text-secondary text-sm">
            שייך משימות לספרינטים, הגדר אחראים וסוקרי CR
            <span className="badge badge-gray" style={{ marginInlineStart: '0.5rem' }}>
              {activeQ.quarter} {activeQ.year}
            </span>
          </p>
        </div>
        <button className={`btn ${creatingSprint ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setCreatingSprint(v => !v)}>
          {creatingSprint ? <><X size={16} /> ביטול</> : <><Plus size={16} /> ספרינט חדש</>}
        </button>
      </header>

      {creatingSprint && (
        <SprintCreateForm
          onSave={handleCreateSprint}
          onCancel={() => setCreatingSprint(false)} />
      )}

      {quarterSprints.length === 0 && !creatingSprint ? (
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <CalendarRange size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין ספרינטים ב-{activeQ.quarter} {activeQ.year}</h3>
          <p className="text-secondary mb-4">צור ספרינט ראשון כדי להתחיל לשייך משימות לצוות</p>
          <button className="btn btn-primary" onClick={() => setCreatingSprint(true)}>
            <Plus size={16} /> צור ספרינט
          </button>
        </div>
      ) : (
        <div className="sb-main-grid">
          {/* Sprint cards */}
          <div className="sb-sprints-col">
            {quarterSprints.map(sprint => (
              <SprintCard key={sprint.id}
                sprint={sprint}
                missions={sprintMissions(sprint.id)}
                features={activeFeatures}
                objectives={activeObjectives}
                roster={activeRoster}
                deleteSprint={deleteSprint}
                updateFeatureTask={updateFeatureTask} />
            ))}
          </div>

          {/* Mission pool */}
          <div className="sb-pool-col">
            <MissionPool
              tasks={productFeatureTasks}
              features={activeFeatures}
              objectives={activeObjectives}
              quarterSprints={quarterSprints}
              updateFeatureTask={updateFeatureTask} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
