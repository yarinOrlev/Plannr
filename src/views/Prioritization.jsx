import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Plus, ChevronDown, ChevronUp, ChevronsUpDown, X, Check, Info, Pencil, Trash2 } from 'lucide-react';
import './Prioritization.css';

const calcRice = (f) => {
  const r = f.reach || 0;
  const i = f.impact || 0;
  const c = f.confidence || 0;
  const e = f.effort || 1;
  return Math.round((r * i * c) / e * 10) / 10;
};

const getRiceColor = (score) => {
  if (score >= 200) return 'badge-pink';
  if (score >= 100) return 'badge-purple';
  if (score >= 50) return 'badge-indigo';
  if (score >= 20) return 'badge-blue';
  return 'badge-gray';
};

const METRIC_INFO = {
  reach: 'כמה משתמשים יושפעו בתקופה מסוימת? (1=מעט, 10=המון)',
  impact: 'כמה זה יתרום למטרה? (1=מינימלי, 10=משנה משחק)',
  confidence: 'כמה אנחנו בטוחים בהערכות האלו? (1=ניחוש פרוע, 10=וודאות גבוהה)',
  effort: 'כמה "חודשי-אדם" זה ייקח? (1=מהיר, 10=פרויקט ענק) - ציון נמוך מעלה את ה-RICE'
};

const Prioritization = () => {
  const { activeFeatures, activeProduct, addFeature, updateFeature, deleteFeature, availableTeams, activeObjectives } = useProductContext();
  const [sortKey, setSortKey] = useState('rice');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFeature, setNewFeature] = useState({ title:'', reach:1, impact:1, confidence:1, effort:1, objective_id: '', teams: [] });
  const [selectedTeams, setSelectedTeams] = useState([]);

  if (!activeProduct) return null;

  const teams = availableTeams || [];
  const objectives = activeObjectives || [];

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const handleEdit = (f) => {
    setNewFeature({
      title: f.title,
      reach: f.reach,
      impact: f.impact,
      confidence: f.confidence,
      effort: f.effort,
      objective_id: f.objective_id || '',
      teams: f.teams || []
    });
    setSelectedTeams(f.teams || []);
    setEditingId(f.id);
    setShowAddForm(true);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...activeFeatures].map(f => ({...f, rice: calcRice(f)})).sort((a,b) => {
    const v = (sortDir === 'asc' ? 1 : -1);
    if (a[sortKey] > b[sortKey]) return v;
    if (a[sortKey] < b[sortKey]) return -v;
    return 0;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newFeature.title.trim()) return;
    
    if (editingId) {
      updateFeature(editingId, { ...newFeature, teams: selectedTeams });
    } else {
      addFeature({ ...newFeature, product_id: activeProduct.id, status:'Planned', teams: selectedTeams });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewFeature({ title:'', reach:1, impact:1, confidence:1, effort:1, objective_id: '', teams: [] });
    setSelectedTeams([]);
    setEditingId(null);
    setShowAddForm(false);
  };

  const SortIcon = ({ k }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
      {sortKey === k
        ? (sortDir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)
        : <ChevronsUpDown size={14} className="text-tertiary"/>}
    </span>
  );

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in prioritization-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">תעדוף פיצ'רים</h1>
          <p className="text-secondary text-lg">מסגרת RICE עבור <strong className="text-primary">{activeProduct.name}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}>
          <Plus size={18}/> {showAddForm ? 'ביטול' : 'הוספת פיצ\'ר'}
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-panel p-6 mb-4 animate-fade-in edit-form-container">
          <div className="flex-between mb-4">
            <h3 className="text-h3">{editingId ? 'עריכת פיצ\'ר' : 'פיצ\'ר חדש'}</h3>
            <button type="button" className="btn-icon" onClick={resetForm}><X size={18}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">שם הפיצ'ר</label>
              <input type="text" autoFocus required style={inputStyle} value={newFeature.title} onChange={e => setNewFeature({...newFeature, title:e.target.value})} placeholder="לדוגמה: ייצוא פעילות משתמשים"/>
            </div>
            {[
              ['reach', 'טווח הגעה', 'reach'],
              ['impact', 'השפעה', 'impact'],
              ['confidence', 'ביטחון', 'confidence'],
              ['effort', 'מאמץ', 'effort']
            ].map(([k, lbl, infoKey]) => (
              <div key={k}>
                <label className="text-sm text-secondary flex-center gap-1 mb-1" style={{ justifyContent: 'flex-start' }}>
                  {lbl} (1-10)
                  <div className="info-tooltip-trigger" title={METRIC_INFO[infoKey]}>
                    <Info size={12} className="text-tertiary" />
                  </div>
                </label>
                <input type="number" min="1" max="10" style={inputStyle} value={newFeature[k]} onChange={e => setNewFeature({...newFeature, [k]:Number(e.target.value)})}/>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">יעד קשור (OKR)</label>
              <select 
                style={inputStyle} 
                value={newFeature.objective_id} 
                onChange={e => setNewFeature({...newFeature, objective_id: e.target.value})}
              >
                <option value="">ללא יעד</option>
                {objectives.map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.title}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm text-secondary block mb-2">צוותים מעורבים</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {teams.map(team => (
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
            <button type="submit" className="btn btn-primary"><Check size={16}/> {editingId ? 'עדכון' : 'שמירה'}</button>
          </div>
        </form>
      )}

      <div className="prioritization-container glass-panel">
        <div className="table-responsive">
          <table className="prioritization-table">
            <thead>
              <tr>
                <th style={{ textAlign:'right' }}>שם הפיצ'ר</th>
                <th>צוותים</th>
                <th>OKR</th>
                {[
                  ['reach', 'טווח', 'reach'],
                  ['impact', 'השפעה', 'impact'],
                  ['confidence', 'ביטחון', 'confidence'],
                  ['effort', 'מאמץ', 'effort'],
                  ['rice', 'ציון RICE', null]
                ].map(([k, lbl, infoKey]) => (
                  <th key={k} style={{ whiteSpace:'nowrap' }}>
                    <div className="flex-center gap-1" style={{ cursor:'pointer' }} onClick={() => handleSort(k)}>
                      {lbl}
                      <SortIcon k={k}/>
                      {infoKey && (
                        <div className="info-tooltip-trigger" title={METRIC_INFO[infoKey]}>
                          <Info size={10} className="text-tertiary" />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.id} className={editingId === f.id ? 'editing-row' : ''}>
                  <td className="font-medium">{f.title}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent:'center' }}>
                      {(f.teams || []).length > 0 ? f.teams.map(t => (
                        <span key={t} className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t}</span>
                      )) : <span className="text-xs text-tertiary">-</span>}
                    </div>
                  </td>
                  <td>
                    {f.objective_id ? (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        {objectives.find(o => o.id === f.objective_id)?.title || 'יעד לא ידוע'}
                      </span>
                    ) : <span className="text-xs text-tertiary">-</span>}
                  </td>
                  <td className="text-center">{f.reach}</td>
                  <td className="text-center">{f.impact}</td>
                  <td className="text-center">{f.confidence}</td>
                  <td className="text-center">{f.effort}</td>
                  <td className="text-center">
                    <span className={`badge ${getRiceColor(f.rice)} score-badge`}>
                      {f.rice}
                    </span>
                  </td>
                  <td>
                    <div className="flex-center gap-2">
                      <button className="btn-icon-xs text-secondary" onClick={() => handleEdit(f)} title="עריכה">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon-xs text-danger" onClick={() => deleteFeature(f.id)} title="מחיקה">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-secondary">לא הוגדרו פיצ'רים לתעדוף</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Prioritization;
