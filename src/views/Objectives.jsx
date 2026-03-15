import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Target, ChevronRight, Plus, Calendar, Activity, TrendingUp, TrendingDown, Minus, X, Check } from 'lucide-react';
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

const ObjectiveCard = ({ objective, linkedFeatures = [] }) => {
  const krs = objective.keyResults || [
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

const QUARTERS = ['הכל','Q1 2026','Q2 2026','Q3 2026','Q4 2026','Q1 2027'];

const Objectives = () => {
  const { activeObjectives, activeProduct, activeKpis, addObjective, data, activeFeatures, searchTerm } = useProductContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', progress:0, quarter:'Q3 2026', kr1:'', kr2:'' });
  const [selectedQuarter, setSelectedQuarter] = useState('הכל');
  const [selectedTeams, setSelectedTeams] = useState([]);

  if (!activeProduct) return null;
  const availableTeams = data.availableTeams || [];

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };
  const filtered = (selectedQuarter === 'הכל' ? activeObjectives : activeObjectives.filter(o => o.quarter === selectedQuarter))
    .filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase()) || o.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addObjective({ 
      product_id:activeProduct.id, 
      title:form.title, 
      progress:Number(form.progress), 
      quarter:form.quarter, 
      keyResults:[{ title:form.kr1||'תוצאת מפתח 1', progress:0 },{ title:form.kr2||'תוצאת מפתח 2', progress:0 }],
      teams: selectedTeams
    });
    setForm({ title:'', progress:0, quarter:'Q3 2026', kr1:'', kr2:'' });
    setSelectedTeams([]);
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
          <div className="flex-between mb-4"><h3 className="text-h3">יעד חדש</h3><button type="button" className="btn-icon" onClick={()=>setShowForm(false)}><X size={18}/></button></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">כותרת היעד</label>
              <input type="text" required autoFocus style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="לדוגמה: הגדלת שיעור שימור משתמשים"/>
            </div>
            <div><label className="text-sm text-secondary block mb-1">רבעון</label><input type="text" style={inputStyle} value={form.quarter} onChange={e => setForm({...form,quarter:e.target.value})}/></div>
            <div><label className="text-sm text-secondary block mb-1">התקדמות (%)</label><input type="number" min="0" max="100" style={inputStyle} value={form.progress} onChange={e => setForm({...form,progress:e.target.value})}/></div>
            <div><label className="text-sm text-secondary block mb-1">תוצאת מפתח 1</label><input style={inputStyle} value={form.kr1} onChange={e => setForm({...form,kr1:e.target.value})} placeholder="תוצאה מדידה..."/></div>
            <div><label className="text-sm text-secondary block mb-1">תוצאת מפתח 2</label><input style={inputStyle} value={form.kr2} onChange={e => setForm({...form,kr2:e.target.value})} placeholder="תוצאה מדידה..."/></div>
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
            <button type="submit" className="btn btn-primary"><Check size={16}/> יצירת יעד</button>
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
