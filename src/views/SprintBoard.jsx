import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useProductContext } from '../context/ProductContext';
import {
  CalendarRange, Plus, Trash2, Check, X, Users, Target,
  ListTodo, Search, Clock,
  UserCheck, Zap, Pencil, Flag, AlertTriangle,
  CalendarClock, Gauge, ListChecks, SlidersHorizontal,
  UserX, HelpCircle, Layers, ChevronDown, ChevronLeft,
} from 'lucide-react';
import DefinitionOfDone from '../components/DefinitionOfDone';
import RichTextEditor from '../components/RichText';
import './SprintBoard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPLEXITY_CONFIG = {
  1: { color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7', desc: 'מאמץ מינימלי' },
  2: { color: '#3B82F6', bg: '#DBEAFE', border: '#93C5FD', desc: 'יחסית קל' },
  3: { color: '#F59E0B', bg: '#FEF3C7', border: '#FCD34D', desc: 'בינוני' },
  4: { color: '#F97316', bg: '#FFEDD5', border: '#FDBA74', desc: 'מורכב' },
  5: { color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5', desc: 'מורכב מאוד' },
};

const STATUS_ORDER = ['Todo', 'In Progress', 'In CR', 'Blocked', 'Done'];
const STATUS_CONFIG = {
  'Todo':        { label: 'ממתין',  dot: '#9CA3AF', soft: '#F3F4F6', text: '#4B5563' },
  'In Progress': { label: 'בעבודה', dot: '#3B82F6', soft: '#EFF6FF', text: '#1D4ED8' },
  'In CR':       { label: 'בסקירה', dot: '#8B5CF6', soft: '#F5F3FF', text: '#6D28D9' },
  'Blocked':     { label: 'חסום',   dot: '#EF4444', soft: '#FEF2F2', text: '#B91C1C' },
  'Done':        { label: 'הושלם',  dot: '#10B981', soft: '#ECFDF5', text: '#047857' },
};

const EMPTY_SPRINT = { name: '', goal: '', start_date: '', end_date: '', working_days: 10 };

// estimate of a mission in days (prefers the days field, falls back to hours/8)
const missionDays = (t) => Number(t.original_estimate_days) || (Number(t.estimate_hours) || 0) / 8;

// ─── Toggleable sprint metrics ────────────────────────────────────────────────
const METRIC_DEFS = [
  { key: 'progress',        label: 'התקדמות' },
  { key: 'estDays',         label: 'ימים מתוכננים' },
  { key: 'capacity',        label: 'עומס מול קיבולת' },
  { key: 'memberCapacity',  label: 'קיבולת לפי איש צוות' },
  { key: 'statusBreakdown', label: 'פילוח סטטוס' },
  { key: 'atRisk',          label: 'משימות בסיכון' },
  { key: 'unassigned',      label: 'משימות ללא אחראי' },
  { key: 'noEstimate',      label: 'משימות ללא הערכה' },
  { key: 'avgComplexity',   label: 'מורכבות ממוצעת' },
  { key: 'dod',             label: 'הגדרת סיום (DoD)' },
];

const DEFAULT_METRICS = {
  progress: true, estDays: true, capacity: true, memberCapacity: true,
  statusBreakdown: true, atRisk: true,
  unassigned: false, noEstimate: false, avgComplexity: false, dod: false,
};

const loadMetrics = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('plannr_sprint_metrics'));
    return { ...DEFAULT_METRICS, ...(saved || {}) };
  } catch { return { ...DEFAULT_METRICS }; }
};

const fmtDate = (d) =>
  !d ? '' : new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
};

const daysUntil = (d) => {
  if (!d) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d) - today) / 86400000);
};

// health of a task by due date + status
const taskHealth = (task) => {
  if (task.status === 'Done') return 'done';
  if (!task.due_date) return 'none';
  const d = daysUntil(task.due_date);
  if (d < 0) return 'overdue';
  if (d <= 2) return 'soon';
  return 'ok';
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const ComplexityBadge = ({ complexity = 3 }) => {
  const c = Number(complexity) || 3;
  const cfg = COMPLEXITY_CONFIG[c] || COMPLEXITY_CONFIG[3];
  return (
    <span title={`מורכבות ${c} — ${cfg.desc}`} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: '5px',
      fontSize: '0.68rem', fontWeight: 800,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>{c}</span>
  );
};

const Avatar = ({ name, title }) => (
  <span className="sb-avatar" title={title || name}>{initials(name)}</span>
);

// ─── Mission card (kanban) ────────────────────────────────────────────────────
const MissionCard = ({ task, feature, objective, roster, onOpen, onDragStart, onDragEnd }) => {
  const health = taskHealth(task);
  const assignee = roster.find(m => m.id === task.assignee_member_id);
  const due = daysUntil(task.due_date);

  const dueLabel = () => {
    if (!task.due_date) return null;
    if (health === 'overdue') return `באיחור ${Math.abs(due)}י'`;
    if (due === 0) return 'היום';
    if (health === 'soon') return `עוד ${due}י'`;
    return fmtDate(task.due_date);
  };

  return (
    <div
      className={`sb-card sb-card--${health}`}
      draggable
      onClick={() => onOpen(task)}
      onDragStart={e => onDragStart(e, task.id, 'board')}
      onDragEnd={onDragEnd}
      title="לחץ לפרטים · גרור לשינוי סטטוס"
    >
      <div className="sb-card-context">
        {objective && <span className="sb-card-obj"><Target size={10} /> {objective.title}</span>}
        {feature && <span className="sb-card-feature">{feature.title}</span>}
      </div>

      <div className="sb-card-title-row">
        <span className="sb-card-title">{task.title}</span>
      </div>

      <div className="sb-card-meta">
        <ComplexityBadge complexity={task.complexity ?? 3} />
        {missionDays(task) > 0 && <span className="sb-card-hours" title="הערכה בימים"><Clock size={11} /> {+missionDays(task).toFixed(1)}י'</span>}
        {Array.isArray(task.definition_of_done) && task.definition_of_done.length > 0 && (() => {
          const items = task.definition_of_done;
          const done = items.filter(i => i.done).length;
          return (
            <span className={`dod-chip ${done === items.length ? 'dod-chip--complete' : ''}`} title="הגדרת סיום">
              <ListChecks size={11} /> {done}/{items.length}
            </span>
          );
        })()}
        {task.due_date && (
          <span className={`sb-card-due sb-card-due--${health}`}>
            {health === 'overdue' || health === 'soon' ? <Flag size={11} /> : <CalendarClock size={11} />}
            {dueLabel()}
          </span>
        )}
        <span className="sb-card-assignee">
          {assignee
            ? <Avatar name={assignee.name} />
            : <span className="sb-avatar sb-avatar--empty"><UserCheck size={12} /></span>}
        </span>
      </div>
    </div>
  );
};

// ─── Task detail / edit modal ─────────────────────────────────────────────────
const TaskDetailModal = ({ task, feature, objective, roster, updateFeatureTask, onRemove, onClose }) => {
  const [form, setForm] = useState(task);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const orig = Number(form.original_estimate_days) || 0;
  const actual = Number(form.actual_time_days) || 0;
  const remaining = orig > 0 ? Math.max(0, orig - actual) : 0;

  // DoD is persisted immediately so items can be ticked off mid-sprint
  // without needing to press Save.
  const setDoD = (items) => {
    setForm(f => ({ ...f, definition_of_done: items }));
    updateFeatureTask(task.id, { definition_of_done: items });
  };

  const save = () => {
    updateFeatureTask(task.id, {
      title: form.title,
      description: form.description || null,
      status: form.status,
      complexity: Number(form.complexity) || 3,
      due_date: form.due_date || null,
      estimate_hours: Number(form.estimate_hours) || 0,
      original_estimate_days: form.original_estimate_days === '' || form.original_estimate_days == null ? null : Number(form.original_estimate_days),
      actual_time_days: form.actual_time_days === '' || form.actual_time_days == null ? null : Number(form.actual_time_days),
      remaining_work_days: orig > 0 ? remaining : null,
      assignee_member_id: form.assignee_member_id || null,
      cr_reviewer_1_id: form.cr_reviewer_1_id || null,
      cr_reviewer_2_id: form.cr_reviewer_2_id || null,
      definition_of_done: Array.isArray(form.definition_of_done) ? form.definition_of_done : [],
    });
    onClose();
  };

  return createPortal(
    <div className="strategy-modal-overlay premium-blur" onClick={onClose}>
      <div className="premium-modal glass-panel animate-scale-in sb-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-premium mb-2">
          <div className="sb-detail-context">
            {objective && <span className="sb-detail-obj"><Target size={12} /> {objective.title}</span>}
            {feature && <span className="sb-detail-feature">{feature.title}</span>}
          </div>
          <button className="close-btn-premium" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="sb-detail-body">
          <div className="sb-detail-field tm-span-2">
            <label className="input-label-premium">שם המשימה</label>
            <input className="premium-input" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="sb-detail-field tm-span-2">
            <label className="input-label-premium">תיאור</label>
            <RichTextEditor
              value={form.description || ''}
              onChange={v => set('description', v)}
              placeholder="תיאור המשימה... אפשר ליצור רשימות עם • או 1." />
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">סטטוס</label>
            <select className="premium-input" value={form.status || 'Todo'} onChange={e => set('status', e.target.value)}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">מורכבות (1–5)</label>
            <select className="premium-input" value={form.complexity ?? 3} onChange={e => set('complexity', Number(e.target.value))}>
              {Object.keys(COMPLEXITY_CONFIG).map(c => (
                <option key={c} value={c}>{c} — {COMPLEXITY_CONFIG[c].desc}</option>
              ))}
            </select>
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">תאריך יעד</label>
            <input type="date" className="premium-input" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">הערכה בימים</label>
            <input type="number" min="0" step="0.5" className="premium-input"
              value={form.original_estimate_days ?? ''} onChange={e => set('original_estimate_days', e.target.value)} />
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">בוצע בפועל (ימים)</label>
            <input type="number" min="0" step="0.5" className="premium-input"
              value={form.actual_time_days ?? ''} onChange={e => set('actual_time_days', e.target.value)} />
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">עבודה נותרת (ימים)</label>
            <div className="premium-input premium-input--readonly" style={{ fontWeight: 700, color: remaining === 0 && orig > 0 ? '#10b981' : 'var(--text-primary)' }}>
              {orig > 0 ? remaining : '—'}
            </div>
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">אחראי</label>
            <select className="premium-input" value={form.assignee_member_id || ''} onChange={e => set('assignee_member_id', e.target.value || null)}>
              <option value="">— ללא —</option>
              {roster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">סוקר CR 1</label>
            <select className="premium-input" value={form.cr_reviewer_1_id || ''} onChange={e => set('cr_reviewer_1_id', e.target.value || null)}>
              <option value="">— ללא —</option>
              {roster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="sb-detail-field">
            <label className="input-label-premium">סוקר CR 2</label>
            <select className="premium-input" value={form.cr_reviewer_2_id || ''} onChange={e => set('cr_reviewer_2_id', e.target.value || null)}>
              <option value="">— ללא —</option>
              {roster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="sb-detail-field tm-span-2">
            <DefinitionOfDone items={form.definition_of_done} onChange={setDoD} />
          </div>
        </div>

        <div className="sb-detail-footer">
          <button className="btn btn-danger-soft" onClick={() => { onRemove(task.id); onClose(); }}>
            <X size={16} /> הסר מהספרינט
          </button>
          <div className="sb-detail-footer-main">
            <button className="btn btn-secondary btn-lg" onClick={onClose}>ביטול</button>
            <button className="btn btn-primary btn-lg" onClick={save}><Check size={18} /> שמירה</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Kanban column ────────────────────────────────────────────────────────────
const KanbanColumn = ({ status, missions, features, objectives, roster, onOpen, onDropTask, dnd, isDragging }) => {
  const [over, setOver] = useState(false);
  const cfg = STATUS_CONFIG[status];

  const handleDrop = (e) => {
    e.preventDefault();
    setOver(false);
    onDropTask(status);
  };

  return (
    <div
      className={`sb-col ${over ? 'sb-col--over' : ''} ${isDragging ? 'sb-col--active-drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <div className="sb-col-header" style={{ '--col-dot': cfg.dot }}>
        <span className="sb-col-dot" />
        <span className="sb-col-name">{cfg.label}</span>
        <span className="sb-col-count">{missions.length}</span>
      </div>
      <div className="sb-col-body">
        {missions.map(task => {
          const feature = features.find(f => f.id === task.feature_id);
          const objective = objectives.find(o => o.id === feature?.objective_id);
          return (
            <MissionCard key={task.id} task={task} feature={feature} objective={objective}
              roster={roster} onOpen={onOpen}
              onDragStart={dnd.start} onDragEnd={dnd.end} />
          );
        })}
        {missions.length === 0 && <div className="sb-col-empty">גרור לכאן</div>}
      </div>
    </div>
  );
};

// ─── Sprint health banner ─────────────────────────────────────────────────────
const HealthBanner = ({ missions }) => {
  const overdue = missions.filter(t => taskHealth(t) === 'overdue');
  const soon = missions.filter(t => taskHealth(t) === 'soon');
  if (overdue.length === 0 && soon.length === 0) return null;
  return (
    <div className={`sb-health ${overdue.length ? 'sb-health--danger' : 'sb-health--warn'}`}>
      <AlertTriangle size={15} />
      <span>
        {overdue.length > 0 && <strong>{overdue.length} משימות באיחור</strong>}
        {overdue.length > 0 && soon.length > 0 && ' · '}
        {soon.length > 0 && <span>{soon.length} מתקרבות לתאריך היעד</span>}
        {' '}— ודא שהסטטוס מעודכן
      </span>
    </div>
  );
};

// ─── Progress ring ────────────────────────────────────────────────────────────
const ProgressRing = ({ pct }) => {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="sb-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} className="sb-ring-track" />
        <circle cx="28" cy="28" r={r} className="sb-ring-fill"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 28 28)" />
      </svg>
      <span className="sb-ring-label">{pct}%</span>
    </div>
  );
};

// ─── Per-member capacity ──────────────────────────────────────────────────────
const MemberCapacity = ({ sprint, missions, roster, getMemberAvailableDays }) => {
  const [collapsed, setCollapsed] = useState(true);
  const rows = roster.map(m => {
    const assigned = missions.filter(t => t.assignee_member_id === m.id);
    const load = assigned.reduce((s, t) => s + missionDays(t), 0);
    const available = getMemberAvailableDays(sprint, m.id) || 0;
    const pct = available > 0 ? (load / available) * 100 : (load > 0 ? 100 : 0);
    return { member: m, count: assigned.length, load, available, pct, over: available > 0 && load > available };
  }).sort((a, b) => b.pct - a.pct);

  const unassigned = missions.filter(t => !t.assignee_member_id);
  const unassignedLoad = unassigned.reduce((s, t) => s + missionDays(t), 0);

  return (
    <div className="sb-capacity glass-panel">
      <button className="sb-capacity-head" onClick={() => setCollapsed(v => !v)}>
        <span className="sb-capacity-title">
          {collapsed ? <ChevronLeft size={15} /> : <ChevronDown size={15} />}
          <Users size={15} /> קיבולת לפי איש צוות
          {collapsed && rows.some(r => r.over) && <AlertTriangle size={13} className="sb-capacity-warn" />}
        </span>
        {!collapsed && <span className="sb-capacity-sub">עומס משויך מול ימי העבודה בספרינט</span>}
      </button>
      {!collapsed && (
      <div className="sb-capacity-list">
        {rows.length === 0 && <div className="sb-capacity-empty">אין חברי צוות פעילים</div>}
        {rows.map(r => (
          <div key={r.member.id} className={`sb-cap-row ${r.over ? 'sb-cap-row--over' : ''}`}>
            <Avatar name={r.member.name} />
            <div className="sb-cap-info">
              <div className="sb-cap-top">
                <span className="sb-cap-name">{r.member.name}</span>
                <span className="sb-cap-nums">
                  {(+r.load.toFixed(1))}<span className="sb-cap-slash">/{(+r.available.toFixed(1))} י'</span>
                  {r.count > 0 && <span className="sb-cap-count">· {r.count} משימות</span>}
                </span>
              </div>
              <div className="sb-cap-track">
                <div className="sb-cap-fill2" style={{ width: `${Math.min(100, r.pct)}%` }} />
                {r.pct > 100 && <div className="sb-cap-over-marker" />}
              </div>
            </div>
            {r.over && <span className="sb-cap-flag" title="חריגה מהקיבולת"><AlertTriangle size={13} /></span>}
          </div>
        ))}
        {unassigned.length > 0 && (
          <div className="sb-cap-unassigned">
            <UserX size={13} />
            {unassigned.length} משימות ללא אחראי ({+unassignedLoad.toFixed(1)} ימים)
          </div>
        )}
      </div>
      )}
    </div>
  );
};

// ─── Sprint workspace (focused sprint) ────────────────────────────────────────
const SprintWorkspace = ({ sprint, missions, features, objectives, roster, updateFeatureTask, getSprintCapacity, getMemberAvailableDays, metrics, toggleMetric, onEdit, onDelete, dnd, isDragging }) => {
  const [detailId, setDetailId] = useState(null);
  const [showMetricsMenu, setShowMetricsMenu] = useState(false);

  const dropToStatus = (status) => {
    const cur = dnd.get();
    if (!cur) return;
    if (cur.from === 'pool') updateFeatureTask(cur.taskId, { sprint_id: sprint.id, status });
    else updateFeatureTask(cur.taskId, { status });
    dnd.end();
  };

  const removeMission = (taskId) =>
    updateFeatureTask(taskId, { sprint_id: null });

  const detailTask = missions.find(t => t.id === detailId);
  const detailFeature = detailTask && features.find(f => f.id === detailTask.feature_id);
  const detailObjective = detailFeature && objectives.find(o => o.id === detailFeature.objective_id);

  const total = missions.length;
  const done = missions.filter(t => t.status === 'Done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const loadDays = missions.reduce((s, t) => s + missionDays(t), 0);
  const capacity = getSprintCapacity(sprint.id);
  const overCapacity = capacity > 0 && loadDays > capacity;

  // extra metric values
  const atRiskCount = missions.filter(t => ['overdue', 'soon'].includes(taskHealth(t))).length;
  const unassignedCount = missions.filter(t => !t.assignee_member_id).length;
  const noEstimateCount = missions.filter(t => !(missionDays(t) > 0)).length;
  const avgComplexity = total ? missions.reduce((s, t) => s + (Number(t.complexity) || 3), 0) / total : 0;
  const dodAgg = missions.reduce((acc, t) => {
    const items = Array.isArray(t.definition_of_done) ? t.definition_of_done : [];
    acc.total += items.length; acc.done += items.filter(i => i.done).length;
    return acc;
  }, { done: 0, total: 0 });

  const duration = daysBetween(sprint.start_date, sprint.end_date);
  const byStatus = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map(s => [s, []]));
    missions.forEach(t => (map[t.status] || map['Todo']).push(t));
    return map;
  }, [missions]);

  return (
    <div className="sb-workspace">
      {/* Sprint summary header */}
      <div className="sb-summary glass-panel">
        <div className="sb-summary-main">
          <div className="sb-summary-titles">
            <div className="sb-summary-name-row">
              <h2 className="sb-summary-name">{sprint.name}</h2>
              <div className="sb-summary-actions">
                <div className="sb-metrics-wrap">
                  <button className={`btn-icon-xs ${showMetricsMenu ? 'sb-metrics-btn--active' : ''}`}
                    onClick={() => setShowMetricsMenu(v => !v)} title="בחר מדדים להצגה"><SlidersHorizontal size={14} /></button>
                  {showMetricsMenu && (
                    <>
                      <div className="sb-metrics-backdrop" onClick={() => setShowMetricsMenu(false)} />
                      <div className="sb-metrics-menu">
                        <div className="sb-metrics-menu-head">מדדים להצגה</div>
                        {METRIC_DEFS.map(m => (
                          <label key={m.key} className="sb-metrics-item">
                            <input type="checkbox" checked={!!metrics[m.key]} onChange={() => toggleMetric(m.key)} />
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button className="btn-icon-xs" onClick={() => onEdit(sprint)} title="ערוך ספרינט"><Pencil size={14} /></button>
                <button className="btn-icon-xs text-danger"
                  onClick={() => window.confirm(`למחוק את "${sprint.name}"?`) && onDelete(sprint.id)}
                  title="מחק ספרינט"><Trash2 size={14} /></button>
              </div>
            </div>
            {sprint.goal
              ? <p className="sb-summary-goal"><Target size={13} /> {sprint.goal}</p>
              : <p className="sb-summary-goal sb-summary-goal--empty" onClick={() => onEdit(sprint)}>+ הוסף מטרת ספרינט</p>}
            <div className="sb-summary-dates">
              <span><CalendarRange size={13} /> {fmtDate(sprint.start_date) || '—'} – {fmtDate(sprint.end_date) || '—'}</span>
              {duration != null && <span className="sb-summary-duration">{duration} ימים</span>}
              <span className="sb-summary-workdays">{sprint.working_days} ימי עבודה/אדם</span>
            </div>
          </div>
          {metrics.progress && <ProgressRing pct={pct} />}
        </div>

        <div className="sb-summary-stats">
          {metrics.progress && (
            <div className="sb-stat">
              <span className="sb-stat-val">{done}/{total}</span>
              <span className="sb-stat-label">משימות הושלמו</span>
            </div>
          )}
          {metrics.estDays && (
            <div className="sb-stat">
              <span className="sb-stat-val">{+loadDays.toFixed(1)}<small>י'</small></span>
              <span className="sb-stat-label">ימים מתוכננים</span>
            </div>
          )}
          {metrics.capacity && (
            <div className={`sb-stat ${overCapacity ? 'sb-stat--over' : ''}`}>
              <span className="sb-stat-val">
                <Gauge size={13} style={{ marginInlineEnd: 3 }} />
                {loadDays.toFixed(1)}<small>/{capacity.toFixed(0)}י'</small>
              </span>
              <span className="sb-stat-label">עומס מול קיבולת</span>
              <div className="sb-cap-bar">
                <div className="sb-cap-fill" style={{ width: `${capacity ? Math.min(100, (loadDays / capacity) * 100) : 0}%` }} />
              </div>
            </div>
          )}
          {metrics.atRisk && (
            <div className={`sb-stat ${atRiskCount > 0 ? 'sb-stat--warn' : ''}`}>
              <span className="sb-stat-val"><Flag size={13} style={{ marginInlineEnd: 3 }} />{atRiskCount}</span>
              <span className="sb-stat-label">משימות בסיכון</span>
            </div>
          )}
          {metrics.unassigned && (
            <div className="sb-stat">
              <span className="sb-stat-val"><UserX size={13} style={{ marginInlineEnd: 3 }} />{unassignedCount}</span>
              <span className="sb-stat-label">ללא אחראי</span>
            </div>
          )}
          {metrics.noEstimate && (
            <div className="sb-stat">
              <span className="sb-stat-val"><HelpCircle size={13} style={{ marginInlineEnd: 3 }} />{noEstimateCount}</span>
              <span className="sb-stat-label">ללא הערכה</span>
            </div>
          )}
          {metrics.avgComplexity && (
            <div className="sb-stat">
              <span className="sb-stat-val"><Layers size={13} style={{ marginInlineEnd: 3 }} />{avgComplexity ? avgComplexity.toFixed(1) : '—'}</span>
              <span className="sb-stat-label">מורכבות ממוצעת</span>
            </div>
          )}
          {metrics.dod && (
            <div className="sb-stat">
              <span className="sb-stat-val"><ListChecks size={13} style={{ marginInlineEnd: 3 }} />{dodAgg.total ? `${dodAgg.done}/${dodAgg.total}` : '—'}</span>
              <span className="sb-stat-label">הגדרת סיום</span>
            </div>
          )}
          {metrics.statusBreakdown && (
            <div className="sb-stat sb-stat--wide">
              <span className="sb-stat-label">פילוח סטטוס</span>
              <div className="sb-status-bar">
                {STATUS_ORDER.map(s => byStatus[s].length > 0 && (
                  <div key={s} className="sb-status-seg" title={`${STATUS_CONFIG[s].label}: ${byStatus[s].length}`}
                    style={{ flex: byStatus[s].length, background: STATUS_CONFIG[s].dot }} />
                ))}
                {total === 0 && <div className="sb-status-seg" style={{ flex: 1, background: 'var(--border-color)' }} />}
              </div>
              <div className="sb-status-legend">
                {STATUS_ORDER.map(s => byStatus[s].length > 0 && (
                  <span key={s} className="sb-status-leg-item">
                    <span className="sb-status-leg-dot" style={{ background: STATUS_CONFIG[s].dot }} />
                    {STATUS_CONFIG[s].label} {byStatus[s].length}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <HealthBanner missions={missions} />

      {metrics.memberCapacity && (
        <MemberCapacity sprint={sprint} missions={missions} roster={roster}
          getMemberAvailableDays={getMemberAvailableDays} />
      )}

      {/* Kanban */}
      <div className="sb-kanban">
        {STATUS_ORDER.map(status => (
          <KanbanColumn key={status} status={status} missions={byStatus[status]}
            features={features} objectives={objectives} roster={roster}
            onOpen={(t) => setDetailId(t.id)}
            onDropTask={dropToStatus} dnd={dnd} isDragging={isDragging} />
        ))}
      </div>

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          feature={detailFeature}
          objective={detailObjective}
          roster={roster}
          updateFeatureTask={updateFeatureTask}
          onRemove={removeMission}
          onClose={() => setDetailId(null)} />
      )}
    </div>
  );
};

// ─── Mission pool (left) ──────────────────────────────────────────────────────
const PoolItem = ({ task, onAssign, onDragStart, onDragEnd }) => (
  <div className="sb-pool-item"
    draggable
    onDragStart={e => onDragStart(e, task.id, 'pool')}
    onDragEnd={onDragEnd}
    onClick={() => onAssign(task.id)}
    title="לחץ או גרור כדי להוסיף לספרינט">
    <button className="sb-pool-add"><Plus size={11} /></button>
    <div className="sb-pool-item-info">
      <span className="sb-pool-item-title">{task.title}</span>
      {task.due_date && <span className="sb-pool-item-due"><CalendarClock size={9} /> {fmtDate(task.due_date)}</span>}
    </div>
    <ComplexityBadge complexity={task.complexity ?? 3} />
  </div>
);

const MissionPool = ({ tasks, features, objectives, sprint, updateFeatureTask, dndHandlers }) => {
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

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach(task => {
      const feat = features.find(f => f.id === task.feature_id);
      const objId = feat?.objective_id || '__none__';
      if (!map.has(objId)) map.set(objId, new Map());
      const fMap = map.get(objId);
      if (!fMap.has(task.feature_id)) fMap.set(task.feature_id, []);
      fMap.get(task.feature_id).push(task);
    });
    return map;
  }, [filtered, features]);

  const assign = (taskId) => sprint && updateFeatureTask(taskId, { sprint_id: sprint.id, status: 'Todo' });

  const handleDrop = (e) => {
    e.preventDefault();
    const cur = dndHandlers.get();
    if (cur?.from === 'board') {
      updateFeatureTask(cur.taskId, { sprint_id: null });
      dndHandlers.end();
    }
  };

  return (
    <div className="sb-pool glass-panel"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}>
      <div className="sb-pool-header">
        <div className="sb-pool-title"><ListTodo size={15} /> בריכת משימות</div>
        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{unassigned.length}</span>
      </div>

      <div className="sb-pool-search">
        <Search size={13} className="sb-pool-search-icon" />
        <input placeholder="חפש משימה..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {sprint && (
        <div className="sb-pool-target">
          מוסיף אל: <strong>{sprint.name}</strong>
        </div>
      )}

      <div className="sb-pool-list">
        {filtered.length === 0 && (
          <div className="sb-pool-empty">
            {unassigned.length === 0
              ? <><Check size={22} className="opacity-20" /><span>כל המשימות שויכו</span></>
              : <><Search size={22} className="opacity-20" /><span>לא נמצאו תוצאות</span></>}
          </div>
        )}
        {[...groups.entries()].map(([objId, featureMap]) => {
          const obj = objectives.find(o => o.id === objId);
          return (
            <div key={objId} className="sb-pool-group">
              <div className="sb-pool-obj"><Target size={11} /> {obj?.title || 'ללא יעד'}</div>
              {[...featureMap.entries()].map(([fId, fTasks]) => {
                const feature = features.find(f => f.id === fId);
                return (
                  <div key={fId} className="sb-pool-feature-group">
                    <div className="sb-pool-feature"><Zap size={10} style={{ opacity: 0.5 }} /> {feature?.title || 'פיצ\'ר'}</div>
                    {fTasks.map(task => (
                      <PoolItem key={task.id} task={task}
                        onAssign={assign} onDragStart={dndHandlers.start} onDragEnd={dndHandlers.end} />
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

// ─── Sprint create / edit form ────────────────────────────────────────────────
const SprintForm = ({ initial, onSave, onCancel }) => {
  const [draft, setDraft] = useState(initial || EMPTY_SPRINT);
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const duration = daysBetween(draft.start_date, draft.end_date);

  return (
    <div className="glass-panel sb-form animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="flex-between mb-4">
        <h3 className="text-h3">{initial ? 'עריכת ספרינט' : 'ספרינט חדש'}</h3>
        <button className="btn-icon" onClick={onCancel}><X size={18} /></button>
      </div>
      <div className="sb-form-grid">
        <div className="sb-field" style={{ gridColumn: '1 / 3' }}>
          <label>שם הספרינט *</label>
          <input className="premium-input" autoFocus value={draft.name}
            onChange={e => set('name', e.target.value)} placeholder="לדוגמה: ספרינט 15" />
        </div>
        <div className="sb-field">
          <label>ימי עבודה לאדם</label>
          <input type="number" min="1" max="30" className="premium-input"
            value={draft.working_days} onChange={e => set('working_days', e.target.value)} />
        </div>
        <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
          <label>מטרת הספרינט</label>
          <input className="premium-input" value={draft.goal}
            onChange={e => set('goal', e.target.value)}
            placeholder="מה נרצה להשיג? (לדוגמה: השלמת תשתית ה-auth)" />
        </div>
        <div className="sb-field">
          <label>תאריך התחלה</label>
          <input type="date" className="premium-input" value={draft.start_date || ''}
            onChange={e => set('start_date', e.target.value)} />
        </div>
        <div className="sb-field">
          <label>תאריך סיום</label>
          <input type="date" className="premium-input" value={draft.end_date || ''}
            onChange={e => set('end_date', e.target.value)} />
        </div>
        <div className="sb-field sb-duration-field">
          <label>משך</label>
          <div className="sb-duration-pill">
            {duration != null ? `${duration} ימים` : '—'}
          </div>
        </div>
      </div>
      <div className="modal-footer-premium mt-4">
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => draft.name.trim() && onSave(draft)}>
          <Check size={16} /> {initial ? 'שמור שינויים' : 'צור ספרינט'}
        </button>
      </div>
    </div>
  );
};

// ─── Sprint tabs ──────────────────────────────────────────────────────────────
const SprintTabs = ({ sprints, missionsOf, focusedId, onFocus }) => (
  <div className="sb-tabs">
    {sprints.map(s => {
      const m = missionsOf(s.id);
      const done = m.filter(t => t.status === 'Done').length;
      const pct = m.length ? Math.round((done / m.length) * 100) : 0;
      const hasRisk = m.some(t => taskHealth(t) === 'overdue');
      return (
        <button key={s.id}
          className={`sb-tab ${focusedId === s.id ? 'sb-tab--active' : ''}`}
          onClick={() => onFocus(s.id)}>
          <div className="sb-tab-top">
            {hasRisk && <Flag size={11} className="sb-tab-flag" />}
            <span className="sb-tab-name">{s.name}</span>
            <span className="sb-tab-count">{m.length}</span>
          </div>
          <div className="sb-tab-bar"><div className="sb-tab-bar-fill" style={{ width: `${pct}%` }} /></div>
        </button>
      );
    })}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const SprintBoard = () => {
  const {
    activeTeamId, teamSprints, teamRoster,
    addSprint, updateSprint, deleteSprint, activeQuarter,
    featureTasks, updateFeatureTask, getSprintCapacity, getMemberAvailableDays,
    activeFeatures, activeObjectives, selectedProductIds,
  } = useProductContext();

  const [formMode, setFormMode] = useState(null); // null | 'create' | sprintObject(edit)
  const [focusedId, setFocusedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [metrics, setMetrics] = useState(loadMetrics);
  const dragRef = React.useRef(null);

  const toggleMetric = (key) => setMetrics(prev => {
    const next = { ...prev, [key]: !prev[key] };
    localStorage.setItem('plannr_sprint_metrics', JSON.stringify(next));
    return next;
  });

  const activeQ = activeQuarter;
  const activeRoster = teamRoster.filter(m => m.active);

  const quarterSprints = useMemo(() =>
    teamSprints
      .filter(s => s.quarter === activeQ.quarter && String(s.year) === String(activeQ.year))
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')),
    [teamSprints, activeQ.quarter, activeQ.year]);

  const productFeatureTasks = useMemo(() =>
    featureTasks.filter(t => !t.product_id || selectedProductIds.includes(t.product_id)),
    [featureTasks, selectedProductIds]);

  const missionsOf = (sprintId) => productFeatureTasks.filter(t => t.sprint_id === sprintId);

  // Derive the focused sprint with a fallback to the first one, so we never need
  // an effect to "repair" focus when sprints are added/removed.
  const focused = quarterSprints.find(s => s.id === focusedId) || quarterSprints[0] || null;

  // Unified DnD bridge: a mutable ref is the single source of truth for the
  // active drag (so the pool can read board-originated drags and vice-versa),
  // plus a boolean state purely to drive column drop-zone visuals.
  const dnd = {
    start: (e, taskId, from) => {
      dragRef.current = { taskId, from };
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', taskId); } catch { /* noop */ }
    },
    end: () => { dragRef.current = null; setIsDragging(false); },
    get: () => dragRef.current,
  };

  const handleSave = async (draft) => {
    const editing = formMode && formMode !== 'create';
    if (editing) {
      await updateSprint(formMode.id, {
        name: draft.name, goal: draft.goal,
        start_date: draft.start_date || null, end_date: draft.end_date || null,
        working_days: Number(draft.working_days) || 10,
      });
    } else {
      const d = draft.start_date ? new Date(draft.start_date) : null;
      const quarter = d ? `Q${Math.floor(d.getMonth() / 3) + 1}` : activeQ.quarter;
      const year = d ? String(d.getFullYear()) : activeQ.year;
      const id = crypto.randomUUID();
      await addSprint({ ...draft, id, working_days: Number(draft.working_days) || 10, quarter, year, team_id: activeTeamId });
      setFocusedId(id);
    }
    setFormMode(null);
  };

  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header">
          <div>
            <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
            <p className="text-secondary text-lg">בנה ספרינט ויזואלי, שייך משימות ונטר התקדמות</p>
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

  return (
    <div className="content-area animate-fade-in sb-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">תכנון ספרינטים</h1>
          <p className="text-secondary text-sm">
            לוח ויזואלי לבניית ספרינט — גרור משימות, נטר התקדמות וזהה סיכונים
            <span className="badge badge-gray" style={{ marginInlineStart: '0.5rem' }}>
              {activeQ.quarter} {activeQ.year}
            </span>
          </p>
        </div>
        <button className={`btn ${formMode === 'create' ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setFormMode(m => m === 'create' ? null : 'create')}>
          {formMode === 'create' ? <><X size={16} /> ביטול</> : <><Plus size={16} /> ספרינט חדש</>}
        </button>
      </header>

      {(formMode === 'create' || (formMode && formMode !== 'create')) && (
        <SprintForm
          initial={formMode !== 'create' ? {
            name: formMode.name, goal: formMode.goal || '',
            start_date: formMode.start_date || '', end_date: formMode.end_date || '',
            working_days: formMode.working_days ?? 10,
          } : null}
          onSave={handleSave}
          onCancel={() => setFormMode(null)} />
      )}

      {quarterSprints.length === 0 && formMode !== 'create' ? (
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <CalendarRange size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין ספרינטים ב-{activeQ.quarter} {activeQ.year}</h3>
          <p className="text-secondary mb-4">צור ספרינט ראשון כדי להתחיל לבנות את הלוח</p>
          <button className="btn btn-primary" onClick={() => setFormMode('create')}>
            <Plus size={16} /> צור ספרינט
          </button>
        </div>
      ) : quarterSprints.length > 0 && (
        <>
          <SprintTabs sprints={quarterSprints} missionsOf={missionsOf}
            focusedId={focused?.id} onFocus={setFocusedId} />

          <div className="sb-board-grid">
            <div className="sb-pool-col">
              <MissionPool
                tasks={productFeatureTasks}
                features={activeFeatures}
                objectives={activeObjectives}
                sprint={focused}
                updateFeatureTask={updateFeatureTask}
                dndHandlers={dnd} />
            </div>
            <div className="sb-work-col">
              {focused && (
                <SprintWorkspace
                  sprint={focused}
                  missions={missionsOf(focused.id)}
                  features={activeFeatures}
                  objectives={activeObjectives}
                  roster={activeRoster}
                  updateFeatureTask={updateFeatureTask}
                  getSprintCapacity={getSprintCapacity}
                  getMemberAvailableDays={getMemberAvailableDays}
                  metrics={metrics}
                  toggleMetric={toggleMetric}
                  dnd={dnd}
                  isDragging={isDragging}
                  onEdit={(s) => setFormMode(s)}
                  onDelete={(id) => { deleteSprint(id); setFormMode(null); }} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SprintBoard;
