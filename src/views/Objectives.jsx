import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Target, ChevronRight, Plus, Calendar, Activity, TrendingUp, TrendingDown, Minus, X, Check, Trash2 } from 'lucide-react';
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

const ObjectiveCard = ({ objective, linkedFeatures = [], onEdit, onDelete }) => {
  const krs = objective.key_results || objective.keyResults || [
    { title: 'תוצאת מפתח 1', progress: Math.min(100, objective.progress+15) },
    { title: 'תוצאת מפתח 2', progress: Math.max(0, objective.progress-10) },
  ];
  return (
    <div className="objective-card glass-panel">
      <div className="objective-header">
        <div className="flex-center gap-3" style={{ justifyContent:'flex-start', alignItems: 'center' }}>
          <div className="icon-badge-rounded i-bg-indigo"><Target size={18}/></div>
          <div>
            <h3 className="text-h3">{objective.title}</h3>
            <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <p className="text-sm text-tertiary">{objective.quarter||'Q3 2026'}</p>
              {(objective.teams || []).map(t => (
                <span key={t} className="badge badge-blue" style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="objective-progress-overall">
          <div className="progress-value">{objective.progress}%</div>
          <div className="progress-label text-xs text-tertiary">כולל</div>
          <div className="flex-center gap-1 mt-2">
            <button className="btn-icon-xs text-tertiary hover:text-primary" onClick={() => onEdit(objective)} title="עריכה"><Check size={14}/></button>
            <button className="btn-icon-xs text-tertiary hover:text-danger" onClick={() => onDelete(objective.id)} title="מחיקה"><Trash2 size={14}/></button>
          </div>
        </div>
      </div>
      <div className="progress-bar-container mt-4"><div className="progress-bar-fill" style={{ width:`${objective.progress}%` }}/></div>
      <div className="key-results mt-6">
        <h4 className="text-sm font-semibold mb-3 text-secondary uppercase" style={{ letterSpacing:'0.05em' }}>תוצאות מפתח</h4>
        {krs.map((kr,i) => (
          <div key={i} className="key-result-item">
            <div className="kr-info"><span className="kr-title text-sm">{kr.title}</span><span className="kr-value text-sm font-medium">{kr.progress}%</span></div>
            <div className="progress-bar-container sm"><div className="progress-bar-fill" style={{ width:`${kr.progress}%` }}/></div>
          </div>
        ))}
      </div>
      {linkedFeatures.length > 0 && (
        <div className="linked-features mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <h4 className="text-xs font-semibold mb-3 text-secondary uppercase" style={{ letterSpacing:'0.05em' }}>פיצ'רים קשורים</h4>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {linkedFeatures.map(f => (
              <span key={f.id} className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{f.title}</span>
            ))}
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
  const { activeObjectives, activeProduct, activeKpis, addObjective, updateObjective, deleteObjective, data, activeFeatures, searchTerm } = useProductContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    progress: 0, 
    quarter: 'Q3',
    year: '2026', 
    keyResults: [{ title: '', progress: 0 }, { title: '', progress: 0 }] 
  });
  const [selectedQuarter, setSelectedQuarter] = useState('הכל');
  const [selectedTeams, setSelectedTeams] = useState([]);

  if (!activeProduct) return null;
  const availableTeams = data.availableTeams || [];

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
      keyResults: obj.key_results || obj.keyResults || [{ title: '', progress: 0 }, { title: '', progress: 0 }]
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
    const totalProgress = validKRs.length > 0 
      ? Math.round(validKRs.reduce((acc, kr) => acc + Number(kr.progress || 0), 0) / validKRs.length)
      : 0;

    const combinedQuarter = `${form.quarter} ${form.year}`;

    if (editingId) {
      updateObjective(editingId, {
        title: form.title,
        progress: totalProgress,
        quarter: combinedQuarter,
        keyResults: validKRs,
        teams: selectedTeams
      });
    } else {
      addObjective({ 
        product_id: activeProduct.id, 
        title: form.title, 
        progress: totalProgress, 
        quarter: combinedQuarter, 
        keyResults: validKRs,
        teams: selectedTeams
      });
    }

    setForm({ 
      title: '', 
      progress: 0, 
      quarter: 'Q3', 
      year: '2026',
      keyResults: [{ title: '', progress: 0 }, { title: '', progress: 0 }] 
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
          <p className="text-secondary text-lg">מדוד את מה שחשוב עבור <strong className="text-primary">{activeProduct.name}</strong></p>
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

        {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 mb-4 animate-fade-in">
          <div className="flex-between mb-4"><h3 className="text-h3">{editingId ? 'עריכת יעד' : 'יעד חדש'}</h3><button type="button" className="btn-icon" onClick={()=>{setShowForm(false); setEditingId(null);}}><X size={18}/></button></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">כותרת היעד</label>
              <input type="text" required autoFocus style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="לדוגמה: הגדלת שיעור שימור משתמשים"/>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="text-sm text-secondary block mb-1">רבעון</label>
                <select style={inputStyle} value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})}>
                  {QUARTER_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-sm text-secondary block mb-1">שנה</label>
                <select style={inputStyle} value={form.year} onChange={e => setForm({...form, year: e.target.value})}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-secondary block mb-1">התקדמות משוערת (%)</label>
              <div style={{ ...inputStyle, background: 'var(--bg-tertiary)', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                {form.keyResults.filter(kr => kr.title.trim() !== '').length > 0 
                  ? Math.round(form.keyResults.filter(kr => kr.title.trim() !== '').reduce((acc, kr) => acc + Number(kr.progress || 0), 0) / form.keyResults.filter(kr => kr.title.trim() !== '').length)
                  : 0}% (מחושב אוטומטית)
              </div>
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
              linkedFeatures={activeFeatures.filter(f => f.objective_id === obj.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
