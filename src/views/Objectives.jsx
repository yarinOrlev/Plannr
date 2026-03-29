import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Target, ChevronRight, ChevronDown, ChevronUp, Plus, Calendar, Activity, TrendingUp, TrendingDown, Minus, X, Check, Trash2, Pencil } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import ProductBadge from '../components/ProductBadge';
import './Objectives.css';

const KpiCard = ({ kpi }) => {
  const isPositive = kpi.trend > 0, isNeutral = kpi.trend === 0;
  return (
    <div className="kpi-card glass-panel">
      <div className="flex-between mb-2">
        <span className="text-sm font-medium text-tertiary">{kpi.title}</span>
        <Activity size={16} className="text-secondary"/>
      </div>
      <div className="text-h2 my-2">{kpi.value}</div>
      <div className="flex-between">
        <span className="text-xs text-secondary">יעד: {kpi.target}</span>
        <span className={`text-xs ${isPositive?'text-success':isNeutral?'text-tertiary':'text-danger'}`} style={{ display:'flex', alignItems:'center', gap:'2px' }}>
          {isPositive?<TrendingUp size={12}/>:isNeutral?<Minus size={12}/>:<TrendingDown size={12}/>}
          {Math.abs(kpi.trend)}%
        </span>
      </div>
    </div>
  );
};

const ObjectiveCard = ({ objective, productName, linkedFeatures = [], availableFeatures = [], onEdit, onDelete, onLinkFeature }) => {
  const [expanded, setExpanded] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const krs = objective.key_results || objective.keyResults || [];
  
  const linkableFeatures = availableFeatures.filter(f => 
    f.product_id === objective.product_id && 
    f.objective_id !== objective.id
  );

  return (
    <div className={`objective-card glass-panel ${expanded ? 'expanded' : ''}`}>
      <div className="objective-header">
        <div className="flex-center gap-3" style={{ justifyContent:'flex-start', alignItems: 'flex-start', flex: 1 }}>
          <div className="icon-badge-rounded i-bg-indigo mt-1"><Target size={18}/></div>
          <div style={{ flex: 1 }}>
            <div className="mb-1" style={{ display: 'flex', justifyContent: 'flex-start' }}>
               <ProductBadge productName={productName} productId={objective.product_id} />
            </div>
            <div className="flex-center gap-2 mb-1" style={{ justifyContent: 'flex-start' }}>
               <h3 className="text-h3" style={{ margin: 0, lineHeight: 1.2 }}>{objective.title}</h3>
            </div>
            <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <p className="text-sm text-tertiary">{objective.quarter||'Q3 2026'}</p>
              {(objective.teams || []).map(t => (
                <span key={t} className="badge badge-blue" style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div className="objective-progress-overall" style={{ textAlign: 'left' }}>
            <div className="progress-value">{objective.progress}%</div>
            <div className="progress-label text-xs text-tertiary">כולל</div>
            <div className="flex-center gap-1 mt-2">
              <button className="btn-icon-xs text-tertiary hover:text-primary" onClick={() => onEdit(objective)} title="עריכה"><Pencil size={14}/></button>
              <button className="btn-icon-xs text-tertiary hover:text-danger" onClick={() => onDelete(objective.id)} title="מחיקה"><Trash2 size={14}/></button>
            </div>
          </div>
          <button className="btn-icon mt-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      <div className="progress-bar-container mt-4"><div className="progress-bar-fill" style={{ width:`${objective.progress}%` }}/></div>
      
      {expanded && (
        <div className="objective-details mt-6 animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {objective.businessValue && (
              <div>
                <h4 className="text-xs font-bold text-tertiary uppercase mb-2">ערך עסקי</h4>
                <p className="text-sm leading-relaxed">{objective.businessValue}</p>
              </div>
            )}
            {objective.risks && (
              <div>
                <h4 className="text-xs font-bold text-tertiary uppercase mb-2">סיכונים</h4>
                <p className="text-sm leading-relaxed">{objective.risks}</p>
              </div>
            )}
            {objective.dependencies && (
              <div>
                <h4 className="text-xs font-bold text-tertiary uppercase mb-2">תלויות</h4>
                <p className="text-sm leading-relaxed">{objective.dependencies}</p>
              </div>
            )}
          </div>

          {(objective.customFields || []).length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-tertiary uppercase mb-2">מידע נוסף</h4>
              <div className="flex gap-4 flex-wrap">
                {objective.customFields.map((cf, idx) => (
                  <div key={idx} className="glass-panel p-2 px-3 bg-white/5" style={{ borderRadius: '8px' }}>
                    <span className="text-[10px] text-tertiary block font-bold mb-1">{cf.label}</span>
                    <span className="text-sm font-medium">{cf.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="key-results">
            <h4 className="text-xs font-bold text-tertiary uppercase mb-3" style={{ letterSpacing:'0.05em' }}>תוצאות מפתח</h4>
            {krs.length > 0 ? krs.map((kr,i) => (
              <div key={i} className="key-result-item mb-3">
                <div className="flex-between mb-1">
                  <span className="kr-title text-sm">{kr.title}</span>
                  <span className="kr-value text-sm font-medium">{kr.progress}%</span>
                </div>
                <div className="progress-bar-container sm"><div className="progress-bar-fill" style={{ width:`${kr.progress}%` }}/></div>
              </div>
            )) : <p className="text-xs text-tertiary italic">אין תוצאות מפתח שהוגדרו</p>}
          </div>

          <div className="linked-features mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex-between mb-3">
              <h4 className="text-xs font-bold text-tertiary uppercase" style={{ letterSpacing:'0.05em' }}>פיצ'רים קשורים</h4>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.2rem 0.6rem', fontSize: '10px' }}
                onClick={() => setIsLinking(!isLinking)}
              >
                {isLinking ? 'ביטול' : (
                  <><Plus size={10} className="ml-1" /> קישור פיצ'ר</>
                )}
              </button>
            </div>

            {isLinking && (
              <div className="mb-4 animate-slide-up">
                <select 
                  className="premium-input text-xs" 
                  style={{ height: '32px' }}
                  onChange={(e) => {
                    if (e.target.value) {
                      onLinkFeature(e.target.value, objective.id);
                      setIsLinking(false);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>בחר פיצ'ר לקישור...</option>
                  {linkableFeatures.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                  {linkableFeatures.length === 0 && <option disabled>אין פיצ'רים זמינים למוצר זה</option>}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {linkedFeatures.length > 0 ? linkedFeatures.map(f => (
                <div key={f.id} className="flex-center gap-1 badge badge-gray" style={{ fontSize: '0.7rem' }}>
                  {f.title}
                  <X 
                    size={10} 
                    className="cursor-pointer hover:text-danger" 
                    onClick={() => onLinkFeature(f.id, null)}
                    title="ביטול קישור"
                  />
                </div>
              )) : <span className="text-xs text-tertiary italic">אין פיצ'רים קשורים</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QUARTER_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEAR_OPTIONS = ['2025', '2026', '2027', '2028'];
const QUARTERS = ['הכל','Q1 2026','Q2 2026','Q3 2026','Q4 2026','Q1 2027'];

const Objectives = () => {
  const { activeObjectives, activeProduct, activeKpis, addObjective, updateObjective, deleteObjective, updateFeature, data, activeFeatures, searchTerm, selectedProductIds, products } = useProductContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    progress: 0, 
    quarter: 'Q3',
    year: '2026', 
    product_id: data?.activeProductId || '',
    keyResults: [{ title: '', progress: 0 }, { title: '', progress: 0 }],
    businessValue: '',
    risks: '',
    dependencies: '',
    customFields: [],
    progressMode: 'auto',
    manualProgress: 0
  });
  const [selectedQuarter, setSelectedQuarter] = useState('הכל');
  const [selectedTeams, setSelectedTeams] = useState([]);

  if (!activeProduct) return null;
  const availableTeams = data.availableTeams || [];

  const addCustomField = () => setForm(prev => ({ ...prev, customFields: [...prev.customFields, { label: '', value: '' }] }));
  const removeCustomField = (idx) => setForm(prev => ({ ...prev, customFields: prev.customFields.filter((_, i) => i !== idx) }));
  const updateCustomField = (idx, field, val) => {
    const next = [...form.customFields];
    next[idx] = { ...next[idx], [field]: val };
    setForm(prev => ({ ...prev, customFields: next }));
  };

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const addKR = () => {
    setForm(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { title: '', progress: 0 }]
    }));
  };

  const removeKR = (index) => {
    setForm(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index)
    }));
  };

  const updateKR = (index, field, value) => {
    const updatedKRs = [...form.keyResults];
    updatedKRs[index] = { ...updatedKRs[index], [field]: value };
    setForm(prev => ({ ...prev, keyResults: updatedKRs }));
  };
  const filtered = (selectedQuarter === 'הכל' ? activeObjectives : activeObjectives.filter(o => o.quarter === selectedQuarter))
    .filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase()) || o.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEdit = (obj) => {
    const [q, y] = obj.quarter ? obj.quarter.split(' ') : ['Q3', '2026'];
    setForm({
      title: obj.title,
      progress: obj.progress || 0,
      quarter: q,
      year: y,
      product_id: obj.product_id || data?.activeProductId,
      keyResults: obj.key_results || obj.keyResults || [{ title: '', progress: 0 }, { title: '', progress: 0 }],
      businessValue: obj.businessValue || '',
      risks: obj.risks || '',
      dependencies: obj.dependencies || '',
      customFields: obj.customFields || [],
      progressMode: obj.progressMode || 'auto',
      manualProgress: obj.progress || 0
    });
    setSelectedTeams(obj.teams || []);
    setEditingId(obj.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק יעד זה?')) {
      deleteObjective(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    const validKRs = form.keyResults.filter(kr => kr.title.trim() !== '');
    const totalProgress = form.progressMode === 'auto'
      ? (validKRs.length > 0 ? Math.round(validKRs.reduce((acc, kr) => acc + Number(kr.progress || 0), 0) / validKRs.length) : 0)
      : Number(form.manualProgress || 0);

    const combinedQuarter = `${form.quarter} ${form.year}`;

    const objectiveData = {
      title: form.title,
      progress: totalProgress,
      quarter: combinedQuarter,
      product_id: form.product_id || activeProduct.id,
      keyResults: validKRs,
      teams: selectedTeams,
      businessValue: form.businessValue,
      risks: form.risks,
      dependencies: form.dependencies,
      customFields: form.customFields,
      progressMode: form.progressMode
    };

    if (editingId) {
      updateObjective(editingId, objectiveData);
    } else {
      addObjective(objectiveData);
    }

    setForm({ 
      title: '', 
      progress: 0, 
      quarter: 'Q3', 
      year: '2026',
      product_id: activeProduct.id,
      keyResults: [{ title: '', progress: 0 }, { title: '', progress: 0 }],
      businessValue: '',
      risks: '',
      dependencies: '',
      customFields: [],
      progressMode: 'auto',
      manualProgress: 0
    });
    setSelectedTeams([]);
    setEditingId(null);
    setShowForm(false);
  };

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in objectives-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">יעדים ותוצאות מפתח (OKR)</h1>
          <p className="text-secondary text-lg">תכנון ומדידת יעדים רבעוניים</p>
        </div>
        <div className="header-actions">
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
            {QUARTERS.map(q => (
              <button key={q} className={`btn ${selectedQuarter===q?'btn-primary':'btn-secondary'}`} style={{ padding:'0.3rem 0.65rem', fontSize:'0.78rem' }} onClick={() => setSelectedQuarter(q)}>
                <Calendar size={13}/> {q}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18}/> {showForm?'ביטול':'יעד חדש'}
          </button>
        </div>
      </header>

      <MultiProductSelector />

        {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 mb-4 animate-fade-in">
          <div className="flex-between mb-4">
            <div className="flex-center gap-2">
              <h3 className="text-h3">{editingId ? 'עריכת יעד' : 'יעד חדש'}</h3>
            </div>
            <button type="button" className="btn-icon" onClick={()=>{setShowForm(false); setEditingId(null);}}><X size={18}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">כותרת היעד</label>
              <input type="text" required autoFocus style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="לדוגמה: הגדלת שיעור שימור משתמשים"/>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="text-sm text-secondary block mb-1">רבעון</label>
                <select style={inputStyle} value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})}>
                  {QUARTER_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="text-sm text-secondary block mb-1">שנה</label>
                <select style={inputStyle} value={form.year} onChange={e => setForm({...form, year: e.target.value})}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="text-sm text-secondary block mb-1">מוצר</label>
                <select style={inputStyle} value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="text-sm text-secondary block mb-1">ערך עסקי</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                  value={form.businessValue} 
                  onChange={e => setForm({...form, businessValue: e.target.value})} 
                  placeholder="איך היעד עוזר לעסק?"
                />
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">סיכונים</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                  value={form.risks} 
                  onChange={e => setForm({...form, risks: e.target.value})} 
                  placeholder="מהם הסיכונים האפשריים?"
                />
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">תלויות</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                  value={form.dependencies} 
                  onChange={e => setForm({...form, dependencies: e.target.value})} 
                  placeholder="באילו גורמים או צוותים היעד תלוי?"
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flex-between mb-2">
                <label className="text-sm text-secondary block">שדות מותאמים אישית</label>
                <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={addCustomField}>
                  <Plus size={10} /> הוסף שדה
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.customFields.map((cf, idx) => (
                  <div key={idx} className="flex-center gap-2">
                    <input style={{ ...inputStyle, flex: 1 }} value={cf.label} onChange={e => updateCustomField(idx, 'label', e.target.value)} placeholder="שם השדה (למשל: ערוץ שיווק)..." />
                    <input style={{ ...inputStyle, flex: 2 }} value={cf.value} onChange={e => updateCustomField(idx, 'value', e.target.value)} placeholder="ערך..." />
                    <button type="button" className="btn-icon" onClick={() => removeCustomField(idx)}><Trash2 size={16} /></button>
                  </div>
                ))}
                {form.customFields.length === 0 && <p className="text-xs text-tertiary italic">אין שדות מותאמים אישית</p>}
              </div>
            </div>

            <div>
              <div className="flex-between mb-1">
                <label className="text-sm text-secondary block">התקדמות (%)</label>
                <div className="flex-center gap-2">
                  <span className="text-[10px] text-tertiary">{form.progressMode === 'auto' ? 'חישוב אוטומטי' : 'הזנה ידנית'}</span>
                  <button 
                    type="button" 
                    className={`btn-icon-xs ${form.progressMode === 'manual' ? 'text-primary' : 'text-tertiary'}`}
                    onClick={() => setForm({...form, progressMode: form.progressMode === 'auto' ? 'manual' : 'auto'})}
                    title="החלף מצב חישוב"
                  >
                    <Activity size={14} />
                  </button>
                </div>
              </div>
              {form.progressMode === 'auto' ? (
                <div style={{ ...inputStyle, background: 'var(--bg-tertiary)', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                  {form.keyResults.filter(kr => kr.title.trim() !== '').length > 0 
                    ? Math.round(form.keyResults.filter(kr => kr.title.trim() !== '').reduce((acc, kr) => acc + Number(kr.progress || 0), 0) / form.keyResults.filter(kr => kr.title.trim() !== '').length)
                    : 0}% (מחושב)
                </div>
              ) : (
                <input 
                  type="number" 
                  min="0" max="100" 
                  style={inputStyle} 
                  value={form.manualProgress} 
                  onChange={e => setForm({...form, manualProgress: e.target.value})} 
                  placeholder="הזן אחוז התקדמות..."
                />
              )}
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flex-between mb-2">
                <label className="text-sm text-secondary block">תוצאות מפתח</label>
                <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={addKR}>
                  <Plus size={10} /> הוסף תוצאה
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {form.keyResults.map((kr, index) => (
                  <div key={index} className="flex-center gap-2" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        style={inputStyle} 
                        value={kr.title} 
                        onChange={e => updateKR(index, 'title', e.target.value)} 
                        placeholder={`תוצאת מפתח ${index + 1}...`}
                      />
                    </div>
                    <div style={{ width: '80px' }}>
                      <input 
                        type="number" 
                        style={inputStyle} 
                        value={kr.progress} 
                        onChange={e => updateKR(index, 'progress', e.target.value)} 
                        placeholder="%"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-icon" 
                      style={{ marginTop: '0.6rem' }}
                      onClick={() => removeKR(index)}
                      disabled={form.keyResults.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm text-secondary block mb-2">צוותים מעורבים</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableTeams.map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => toggleTeam(team)}
                    className={`badge ${selectedTeams.includes(team) ? 'badge-blue' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', padding: '0.4rem 0.75rem' }}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-start', marginTop:'1.25rem' }}>
            <button type="submit" className="btn btn-primary"><Check size={16}/> {editingId ? 'עדכון יעד' : 'יצירת יעד'}</button>
          </div>
        </form>
      )}

      {activeKpis?.length > 0 && (
        <div className="kpi-section mb-8">
          <h2 className="text-base font-semibold text-secondary uppercase mb-4" style={{ letterSpacing:'0.07em' }}>מדדי ביצוע עיקריים (KPI)</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem' }}>
            {activeKpis.map(kpi => <KpiCard key={kpi.id} kpi={kpi}/>)}
          </div>
        </div>
      )}

      <div className="objectives-section">
        <h2 className="text-base font-semibold text-secondary uppercase mb-4" style={{ letterSpacing:'0.07em' }}>
          {selectedQuarter === 'הכל' ? 'כל היעדים' : `יעדים — ${selectedQuarter}`}
        </h2>
        <div className="objectives-list">
          {filtered.map(obj => (
            <ObjectiveCard 
              key={obj.id} 
              objective={obj} 
              productName={selectedProductIds.length > 1 ? data.products.find(p => p.id === obj.product_id)?.name : null}
              linkedFeatures={activeFeatures.filter(f => f.objective_id === obj.id)}
              availableFeatures={activeFeatures}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLinkFeature={(featureId, objectiveId) => updateFeature(featureId, { objective_id: objectiveId })}
            />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <Target size={48} className="text-tertiary mb-4"/>
              <h3 className="text-h3 mb-2">אין יעדים</h3>
              <p className="text-secondary mb-4">{selectedQuarter==='הכל'?'לא הוגדרו יעדים עדיין.':`אין יעדים עבור ${selectedQuarter}.`}</p>
              <button className="btn btn-primary" onClick={()=>setShowForm(true)}>צור יעד ראשון</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Objectives;
