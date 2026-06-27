import React, { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import {
  Plus, ChevronDown, ChevronRight, X, Check, Info, Pencil, Trash2,
  Settings, Sliders, AlertCircle, Target, ListTodo
} from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import ProductBadge from '../components/ProductBadge';
import './Prioritization.css';

const calcRice = (t) => {
  const r = Number(t.reach || 1);
  const i = Number(t.impact || 1);
  const c = Number(t.confidence || 1);
  const e = Number(t.effort || 1);
  return Math.round((r * i * c) / (e || 1) * 10) / 10;
};

const riceColor = (score) => {
  if (score >= 200) return 'badge-pink';
  if (score >= 100) return 'badge-purple';
  if (score >= 50)  return 'badge-indigo';
  if (score >= 20)  return 'badge-blue';
  return 'badge-gray';
};

const COMPLEXITY_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'];
const COMPLEXITY_CONFIG = {
  XS: { color: '#10B981', bg: '#D1FAE5', border: '#6EE7B7' },
  S:  { color: '#3B82F6', bg: '#DBEAFE', border: '#93C5FD' },
  M:  { color: '#F59E0B', bg: '#FEF3C7', border: '#FCD34D' },
  L:  { color: '#F97316', bg: '#FFEDD5', border: '#FDBA74' },
  XL: { color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' },
};

const ComplexityBadge = ({ complexity = 'M' }) => {
  const cfg = COMPLEXITY_CONFIG[complexity] || COMPLEXITY_CONFIG['M'];
  return (
    <span style={{
      display: 'inline-block', padding: '0.1rem 0.45rem', borderRadius: '6px',
      fontSize: '0.68rem', fontWeight: '700',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>{complexity}</span>
  );
};

const BLANK_TASK = { title: '', description: '', complexity: 'M', estimate_hours: 0, reach: 1, impact: 1, confidence: 1, effort: 1 };

// ─── RICE input field helper ──────────────────────────────────────────────────
const RiceField = ({ label, tooltip, value, onChange }) => (
  <div className="rice-field">
    <label className="rice-label" title={tooltip}>{label}</label>
    <input type="number" min="0.1" step="0.1" className="premium-input rice-input"
      value={value} onChange={e => onChange(Number(e.target.value))} />
  </div>
);

// ─── Single task row ──────────────────────────────────────────────────────────
const TaskRow = ({ task, onEdit, onDelete }) => {
  const score = calcRice(task);
  return (
    <tr className="task-row">
      <td className="task-title-cell">
        <div className="task-indent">
          <span className="task-connector" />
          <ListTodo size={13} className="task-icon" />
          <div>
            <span className="task-title-text">{task.title}</span>
            {task.description && (
              <p className="task-desc-preview">{task.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="text-center"><ComplexityBadge complexity={task.complexity || 'M'} /></td>
      <td className="text-center rice-val">{task.estimate_hours > 0 ? `${task.estimate_hours}ש'` : '—'}</td>
      <td className="text-center rice-val">{task.reach}</td>
      <td className="text-center rice-val">{task.impact}</td>
      <td className="text-center rice-val">{task.confidence}</td>
      <td className="text-center rice-val">{task.effort}</td>
      <td className="text-center">
        <span className={`badge ${riceColor(score)} score-badge`}>{score}</span>
      </td>
      <td>
        <div className="flex-center gap-1">
          <button className="btn-icon-xs text-secondary" onClick={() => onEdit(task)} title="עריכה"><Pencil size={12} /></button>
          <button className="btn-icon-xs text-danger" onClick={() => onDelete(task.id)} title="מחיקה"><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
};

// ─── Add / edit task inline form ──────────────────────────────────────────────
const TaskForm = ({ featureId, initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || BLANK_TASK);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const score = calcRice(form);

  return (
    <tr className="task-form-row">
      <td colSpan={9}>
        <div className="task-form-inner">
          {/* Row 1: title + complexity + hours */}
          <div className="task-form-row1">
            <input autoFocus className="premium-input task-form-title"
              placeholder="שם המשימה..." value={form.title}
              onChange={e => set('title', e.target.value)} />
            <div className="rice-field">
              <label className="rice-label">מורכבות</label>
              <select className="premium-input rice-input" value={form.complexity}
                onChange={e => set('complexity', e.target.value)}>
                {COMPLEXITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="rice-field">
              <label className="rice-label">שעות הערכה</label>
              <input type="number" min="0" step="0.5" className="premium-input rice-input"
                value={form.estimate_hours} onChange={e => set('estimate_hours', Number(e.target.value))} />
            </div>
          </div>
          {/* Row 2: description */}
          <textarea className="premium-input task-form-desc" rows={2}
            placeholder="תיאור המשימה (אופציונלי)..."
            value={form.description} onChange={e => set('description', e.target.value)} />
          {/* Row 3: RICE */}
          <div className="task-form-rice">
            <RiceField label="Reach" tooltip="כמה משתמשים יושפעו?" value={form.reach} onChange={v => set('reach', v)} />
            <RiceField label="Impact" tooltip="כמה זה יתרום?" value={form.impact} onChange={v => set('impact', v)} />
            <RiceField label="Confidence" tooltip="כמה אנחנו בטוחים?" value={form.confidence} onChange={v => set('confidence', v)} />
            <RiceField label="Effort" tooltip="כמה זמן ייקח (מחלק)?" value={form.effort} onChange={v => set('effort', v)} />
            <div className="rice-field rice-score-preview">
              <label className="rice-label">ציון RICE</label>
              <span className={`badge ${riceColor(score)} score-badge`}>{score}</span>
            </div>
          </div>
          <div className="task-form-actions">
            <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}><X size={14} /> ביטול</button>
            <button className="btn btn-primary btn-sm" type="button"
              onClick={() => { if (form.title.trim()) onSave(form); }}>
              <Check size={14} /> שמור
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ─── Feature block ────────────────────────────────────────────────────────────
const FeatureBlock = ({ feature, objectives, products, scoringConfig, featureTasks, onEditFeature, onDeleteFeature, addFeatureTask, updateFeatureTask, deleteFeatureTask }) => {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const tasks = featureTasks.filter(t => t.feature_id === feature.id);

  const totalScore = useMemo(() => {
    let m = 1, d = 1;
    scoringConfig.forEach(c => {
      const val = (feature[c.id] || c.defaultValue || 0) * (c.weight || 1);
      c.type === 'divider' ? (d *= val || 1) : (m *= val);
    });
    return Math.round((m / (d || 1)) * 10) / 10;
  }, [feature, scoringConfig]);

  const getScoreColor = (s) => {
    if (s >= 200) return 'badge-pink';
    if (s >= 100) return 'badge-purple';
    if (s >= 50)  return 'badge-indigo';
    if (s >= 20)  return 'badge-blue';
    return 'badge-gray';
  };

  const saveTask = async (form) => {
    if (editingTask) {
      await updateFeatureTask(editingTask.id, form);
      setEditingTask(null);
    } else {
      await addFeatureTask({ ...form, feature_id: feature.id, product_id: feature.product_id || null });
      setAddingTask(false);
    }
  };

  const deleteTask = (id) => deleteFeatureTask(id);

  const productNames = (feature.product_ids || [feature.product_id]).map(
    pid => products.find(p => p.id === pid)
  ).filter(Boolean);

  return (
    <>
      {/* Feature row */}
      <tr className={`feature-row ${expanded ? 'feature-row--expanded' : ''}`}>
        <td className="feature-title-cell">
          <div className="feature-title-wrapper">
            <button
              className={`expand-btn ${expanded ? 'expanded' : ''}`}
              onClick={() => setExpanded(v => !v)}
              title={expanded ? 'כווץ' : 'הרחב'}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div className="feature-title-body">
              <span className="feature-name">{feature.title}</span>
              {tasks.length > 0 && (
                <span className="tasks-chip">{tasks.length} משימות</span>
              )}
            </div>
          </div>
        </td>
        <td>
          <div className="flex gap-1 flex-wrap">
            {productNames.map(p => <ProductBadge key={p.id} productName={p.name} productId={p.id} />)}
          </div>
        </td>
        {scoringConfig.map(c => (
          <td key={c.id} className="text-center feature-metric">{feature[c.id] || c.defaultValue}</td>
        ))}
        <td className="text-center">
          <span className={`badge ${getScoreColor(totalScore)} score-badge font-bold`}>{totalScore}</span>
        </td>
        <td>
          <div className="flex-center gap-1">
            <button
              className="btn-icon-xs text-accent"
              onClick={() => { setExpanded(true); setAddingTask(true); }}
              title="הוסף משימה"
            >
              <Plus size={13} />
            </button>
            <button className="btn-icon-xs text-secondary" onClick={() => onEditFeature(feature)} title="עריכה"><Pencil size={13} /></button>
            <button className="btn-icon-xs text-danger" onClick={() => onDeleteFeature(feature.id)} title="מחיקה"><Trash2 size={13} /></button>
          </div>
        </td>
      </tr>

      {/* Task sub-header */}
      {expanded && (tasks.length > 0 || addingTask) && (
        <tr className="task-subheader-row">
          <th className="task-subheader-cell" style={{ paddingRight: '3.5rem' }}>משימה</th>
          <th className="task-subheader-cell text-center">מורכבות</th>
          <th className="task-subheader-cell text-center">שעות</th>
          <th className="task-subheader-cell text-center">Reach</th>
          <th className="task-subheader-cell text-center">Impact</th>
          <th className="task-subheader-cell text-center">Conf.</th>
          <th className="task-subheader-cell text-center">Effort</th>
          <th className="task-subheader-cell text-center">RICE</th>
          <th className="task-subheader-cell"></th>
        </tr>
      )}

      {/* Task rows */}
      {expanded && tasks.map(task =>
        editingTask?.id === task.id
          ? <TaskForm key={task.id} featureId={feature.id} initial={editingTask} onSave={saveTask} onCancel={() => setEditingTask(null)} />
          : <TaskRow key={task.id} task={task} onEdit={t => { setEditingTask(t); setAddingTask(false); }} onDelete={id => deleteFeatureTask(id)} />
      )}

      {/* Add task form */}
      {expanded && addingTask && !editingTask && (
        <TaskForm featureId={feature.id} onSave={saveTask} onCancel={() => setAddingTask(false)} />
      )}

      {/* Empty tasks nudge */}
      {expanded && tasks.length === 0 && !addingTask && (
        <tr className="task-empty-row">
          <td colSpan={9}>
            <div className="task-empty-inner">
              <ListTodo size={16} className="opacity-30" />
              <span>אין משימות לפיצ'ר זה</span>
              <button className="btn btn-xs btn-secondary" onClick={() => setAddingTask(true)}>
                <Plus size={12} /> הוסף משימה
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Objective section ────────────────────────────────────────────────────────
const ObjectiveSection = ({ objective, features, products, scoringConfig, featureTasks, onEditFeature, onDeleteFeature, addFeatureTask, updateFeatureTask, deleteFeatureTask, onAddFeature }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="objective-section glass-panel">
      {/* Objective header */}
      <div className="objective-header" onClick={() => setCollapsed(v => !v)}>
        <div className="objective-header-left">
          <div className="objective-icon-badge">
            <Target size={14} />
          </div>
          <div>
            <span className="objective-title">{objective?.title || 'ללא יעד'}</span>
            <span className="objective-meta">{features.length} פיצ'רים</span>
          </div>
        </div>
        <div className="objective-header-right">
          <button
            className="btn btn-xs btn-secondary"
            onClick={e => { e.stopPropagation(); onAddFeature(objective?.id); }}
          >
            <Plus size={12} /> פיצ'ר
          </button>
          <span className="collapse-btn">
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="table-responsive">
          <table className="prioritization-table features-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>פיצ'ר / משימה</th>
                <th>מוצרים</th>
                {scoringConfig.map(c => (
                  <th key={c.id} className="metric-col">{c.label.split(' ')[0]}</th>
                ))}
                <th>ציון</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <FeatureBlock key={f.id} feature={f}
                  objectives={objective ? [objective] : []} products={products}
                  scoringConfig={scoringConfig} featureTasks={featureTasks}
                  onEditFeature={onEditFeature} onDeleteFeature={onDeleteFeature}
                  addFeatureTask={addFeatureTask} updateFeatureTask={updateFeatureTask}
                  deleteFeatureTask={deleteFeatureTask} />
              ))}
              {features.length === 0 && (
                <tr>
                  <td colSpan={scoringConfig.length + 4} className="text-center py-8">
                    <div className="flex-center flex-col text-tertiary gap-2">
                      <AlertCircle size={28} className="opacity-20" />
                      <p className="text-sm">אין פיצ'רים ביעד זה</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Prioritization = () => {
  const {
    activeFeatures, activeProduct, data,
    addFeature, updateFeature, deleteFeature,
    availableTeams, activeObjectives, searchTerm,
    updateScoringConfig, activeQuarter,
    featureTasks, addFeatureTask, updateFeatureTask, deleteFeatureTask
  } = useProductContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addForObjectiveId, setAddForObjectiveId] = useState('');
  const [newFeature, setNewFeature] = useState({ title: '', objective_id: '', teams: [], productIds: [] });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [featureMetrics, setFeatureMetrics] = useState({});

  if (!activeProduct) return null;

  const scoringConfig = data.scoringConfig || [];
  const objectives = activeObjectives || [];
  const quarterLabel = `${activeQuarter.quarter} ${activeQuarter.year}`;

  const quarterObjectiveIds = new Set(
    objectives.filter(o => (o.quarter || '') === quarterLabel).map(o => o.id)
  );

  const filteredFeatures = activeFeatures
    .filter(f => !f.objective_id || quarterObjectiveIds.has(f.objective_id))
    .filter(f =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Group by objective
  const groups = useMemo(() => {
    const map = new Map();
    // objectives that have features
    filteredFeatures.forEach(f => {
      const key = f.objective_id || '__none__';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    });
    // ensure objectives without features but in quarter still show
    objectives.filter(o => quarterObjectiveIds.has(o.id)).forEach(o => {
      if (!map.has(o.id)) map.set(o.id, []);
    });
    return map;
  }, [filteredFeatures, objectives, quarterObjectiveIds]);

  const openAddForm = (objectiveId = '') => {
    setAddForObjectiveId(objectiveId);
    setNewFeature({ title: '', objective_id: objectiveId, teams: [], productIds: [] });
    setFeatureMetrics({});
    setSelectedProducts([activeProduct.id]);
    setEditingId(null);
    setShowAddForm(true);
  };

  const handleEdit = (f) => {
    const metrics = {};
    scoringConfig.forEach(c => { metrics[c.id] = f[c.id] || c.defaultValue; });
    setNewFeature({ title: f.title, objective_id: f.objective_id || '', teams: f.teams || [], productIds: f.product_ids || [f.product_id] });
    setFeatureMetrics(metrics);
    setSelectedProducts(f.product_ids || [f.product_id]);
    setEditingId(f.id);
    setShowAddForm(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newFeature.title.trim()) return;
    if (selectedProducts.length === 0) { alert('יש לבחור לפחות מוצר אחד'); return; }
    const featureData = { ...newFeature, ...featureMetrics, teams: [], productIds: selectedProducts };
    if (editingId) updateFeature(editingId, featureData);
    else addFeature({ ...featureData, status: 'Planned' });
    resetForm();
  };

  const resetForm = () => {
    setNewFeature({ title: '', objective_id: '', teams: [], productIds: [] });
    setFeatureMetrics({});
    setSelectedProducts([activeProduct.id]);
    setEditingId(null);
    setShowAddForm(false);
  };

  const toggleProduct = (pid) =>
    setSelectedProducts(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]);

  // Ordered objective keys: objectives first (by quarter), then __none__
  const orderedKeys = [
    ...objectives.filter(o => quarterObjectiveIds.has(o.id)).map(o => o.id),
    ...(groups.has('__none__') ? ['__none__'] : [])
  ];

  return (
    <div className="content-area animate-fade-in prioritization-layout">
      {/* ── Page header ── */}
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">פיצ'רים ומשימות</h1>
          <p className="text-secondary text-lg">
            תעדוף פיצ'רים ומשימות לפי מתודולוגיית RICE
            <span className="badge badge-gray" style={{ marginInlineStart: '0.5rem' }}>
              {quarterLabel}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            <Settings size={18} /> הגדרות ניקוד
          </button>
          <button
            className={`btn ${showAddForm ? 'btn-danger-soft' : 'btn-primary'}`}
            onClick={() => showAddForm ? resetForm() : openAddForm()}
          >
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
            {showAddForm ? 'ביטול' : 'הוספת פיצ\'ר'}
          </button>
        </div>
      </header>

      <MultiProductSelector />

      {/* ── Settings modal ── */}
      {showSettings && (
        <div className="strategy-modal-overlay premium-blur" onClick={() => setShowSettings(false)}>
          <div className="strategy-modal premium-modal glass-panel animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header-premium mb-4">
              <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                <div className="icon-badge-sm bg-purple"><Sliders size={20} /></div>
                <h3 className="text-h2">הגדרות מודל תעדוף</h3>
              </div>
              <button className="close-btn-premium" onClick={() => setShowSettings(false)}><X size={24} /></button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-indigo-500 mt-1 shrink-0" />
                <div className="text-sm leading-relaxed text-secondary rtl">
                  <p className="font-bold text-primary mb-1">כיצד מחושב הציון?</p>
                  <p>הציון מחושב על ידי מכפלת כל מדדי ה-<strong>Multiplier</strong> וחילוק בתוצאת כל מדדי ה-<strong>Divider</strong>.</p>
                </div>
              </div>
            </div>
            <div className="settings-scroll-area" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '0.25rem' }}>
              <table className="prioritization-table mb-6">
                <thead>
                  <tr>
                    <th>שם המדד</th><th>סוג</th><th>משקל</th><th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringConfig.map((config, index) => (
                    <tr key={config.id}>
                      <td>
                        <input className="premium-input text-sm" value={config.label}
                          onChange={e => { const nc = [...scoringConfig]; nc[index].label = e.target.value; updateScoringConfig(nc); }} />
                      </td>
                      <td>
                        <select className="premium-input text-sm" value={config.type}
                          onChange={e => { const nc = [...scoringConfig]; nc[index].type = e.target.value; updateScoringConfig(nc); }}>
                          <option value="multiplier">מכפיל (חיובי)</option>
                          <option value="divider">מחלק (שלילי/מאמץ)</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" step="0.1" className="premium-input text-sm" style={{ width: '80px' }} value={config.weight}
                          onChange={e => { const nc = [...scoringConfig]; nc[index].weight = Number(e.target.value); updateScoringConfig(nc); }} />
                      </td>
                      <td>
                        <button className="btn-icon text-danger" onClick={() => updateScoringConfig(scoringConfig.filter((_, i) => i !== index))}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-secondary w-full" onClick={() =>
                updateScoringConfig([...scoringConfig, { id: `custom_${Date.now()}`, label: 'מדד חדש', weight: 1, type: 'multiplier', defaultValue: 1 }])
              }>
                <Plus size={16} /> הוספת מדד חדש
              </button>
            </div>
            <div className="modal-footer-premium mt-8">
              <button className="btn btn-primary btn-lg w-full" onClick={() => setShowSettings(false)}>סגור ושמור</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit feature form ── */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-panel p-6 mb-4 animate-fade-in edit-form-container">
          <div className="flex-between mb-4">
            <h3 className="text-h3">{editingId ? 'עריכת פיצ\'ר' : 'פיצ\'ר חדש'}</h3>
            <button type="button" className="btn-icon" onClick={resetForm}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label-premium">שם הפיצ'ר</label>
              <input type="text" autoFocus required className="premium-input"
                value={newFeature.title}
                onChange={e => setNewFeature({ ...newFeature, title: e.target.value })}
                placeholder="לדוגמה: ייצוא פעילות משתמשים" />
            </div>
            <div style={{ gridColumn: '1 / -1' }} className="form-section-premium">
              <label className="input-label-premium mb-3">שיוך למוצרים</label>
              <div className="flex gap-2 flex-wrap">
                {data.products.map(p => (
                  <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                    className={`badge-premium ${selectedProducts.includes(p.id) ? 'active' : ''}`}>
                    {p.name}
                    {selectedProducts.includes(p.id) ? <Check size={12} /> : <Plus size={12} />}
                  </button>
                ))}
              </div>
            </div>
            {scoringConfig.map(c => (
              <div key={c.id}>
                <label className="input-label-premium flex-center gap-1 mb-1" style={{ justifyContent: 'flex-start' }}>
                  {c.label}
                  {c.info && <span title={c.info}><Info size={14} className="text-tertiary" /></span>}
                </label>
                <input type="number" step="0.1" className="premium-input"
                  value={featureMetrics[c.id] || c.defaultValue || 1}
                  onChange={e => setFeatureMetrics({ ...featureMetrics, [c.id]: Number(e.target.value) })} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label-premium">יעד קשור (OKR)</label>
              <select className="premium-input" value={newFeature.objective_id}
                onChange={e => setNewFeature({ ...newFeature, objective_id: e.target.value })}>
                <option value="">ללא יעד</option>
                {objectives.map(obj => (
                  <option key={obj.id} value={obj.id}>
                    ({data.products.find(p => p.id === obj.product_id)?.name}) {obj.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer-premium mt-8">
            <button type="button" className="btn btn-secondary btn-lg" onClick={resetForm}>ביטול</button>
            <button type="submit" className="btn btn-primary btn-lg"><Check size={20} /> {editingId ? 'עדכון פיצ\'ר' : 'שמירת פיצ\'ר'}</button>
          </div>
        </form>
      )}

      {/* ── Objective sections ── */}
      <div className="objectives-list">
        {orderedKeys.map(key => {
          const objective = key === '__none__' ? null : objectives.find(o => o.id === key);
          const features = groups.get(key) || [];
          return (
            <ObjectiveSection
              key={key}
              objective={objective}
              features={features}
              products={data.products}
              scoringConfig={scoringConfig}
              featureTasks={featureTasks}
              onEditFeature={handleEdit}
              onDeleteFeature={deleteFeature}
              addFeatureTask={addFeatureTask}
              updateFeatureTask={updateFeatureTask}
              deleteFeatureTask={deleteFeatureTask}
              onAddFeature={openAddForm}
            />
          );
        })}

        {orderedKeys.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <div className="flex-center flex-col text-tertiary gap-3">
              <AlertCircle size={48} className="opacity-20" />
              <p className="text-lg">לא נמצאו פיצ'רים לרבעון {quarterLabel}</p>
              <button className="btn btn-primary" onClick={() => openAddForm()}>
                <Plus size={18} /> הוסף פיצ'ר ראשון
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prioritization;
