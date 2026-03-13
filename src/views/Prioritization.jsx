import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Plus, ChevronDown, ChevronUp, ChevronsUpDown, X, Check } from 'lucide-react';
import './Prioritization.css';

const calcRice = (f) => {
  const r = f.reach || 0;
  const i = f.impact || 0;
  const c = f.confidence || 0;
  const e = f.effort || 1;
  return Math.round((r * i * c) / e * 10) / 10;
};

const Prioritization = () => {
  const { activeFeatures, activeProduct, addFeature, availableTeams, activeObjectives } = useProductContext();
  const [sortKey, setSortKey] = useState('rice');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({ title:'', reach:1, impact:1, confidence:1, effort:1, objectiveId: '', teams: [] });
  const [selectedTeams, setSelectedTeams] = useState([]);

  if (!activeProduct) return null;

  const teams = availableTeams || [];
  const objectives = activeObjectives || [];

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...activeFeatures].map(f => ({...f, rice: calcRice(f)})).sort((a,b) => {
    const v = (sortDir === 'asc' ? 1 : -1);
    return a[sortKey] > b[sortKey] ? v : -v;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newFeature.title.trim()) return;
    addFeature({ ...newFeature, productId: activeProduct.id, status:'Planned', teams: selectedTeams });
    setNewFeature({ title:'', reach:1, impact:1, confidence:1, effort:1, objectiveId: '', teams: [] });
    setSelectedTeams([]);
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
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18}/> {showAddForm ? 'ביטול' : 'הוספת פיצ\'ר'}
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-panel p-6 mb-4 animate-fade-in">
          <div className="flex-between mb-4">
            <h3 className="text-h3">פיצ'ר חדש</h3>
            <button type="button" className="btn-icon" onClick={() => setShowAddForm(false)}><X size={18}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">שם הפיצ'ר</label>
              <input type="text" autoFocus required style={inputStyle} value={newFeature.title} onChange={e => setNewFeature({...newFeature, title:e.target.value})} placeholder="לדוגמה: ייצוא פעילות משתמשים"/>
            </div>
            {[['reach','טווח הגעה'],['impact','השפעה'],['confidence','ביטחון'],['effort','מאמץ']].map(([k,lbl]) => (
              <div key={k}>
                <label className="text-sm text-secondary block mb-1">{lbl} (1-10)</label>
                <input type="number" min="1" max="10" style={inputStyle} value={newFeature[k]} onChange={e => setNewFeature({...newFeature, [k]:Number(e.target.value)})}/>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">יעד קשור (OKR)</label>
              <select 
                style={inputStyle} 
                value={newFeature.objectiveId} 
                onChange={e => setNewFeature({...newFeature, objectiveId: e.target.value})}
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
            <button type="submit" className="btn btn-primary"><Check size={16}/> שמירה</button>
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
                {[['reach','טווח'],['impact','השפעה'],['confidence','ביטחון'],['effort','מאמץ'],['rice','ציון RICE']].map(([k,lbl]) => (
                  <th key={k} onClick={() => handleSort(k)} style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', justifyContent: 'center' }}>
                      {lbl}
                      <SortIcon k={k}/>
                    </div>
                  </th>
                ))}
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, i) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.title}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(f.teams || []).length > 0 ? f.teams.map(t => (
                        <span key={t} className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t}</span>
                      )) : <span className="text-xs text-tertiary">-</span>}
                    </div>
                  </td>
                  <td>
                    {f.objectiveId ? (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        {objectives.find(o => o.id === f.objectiveId)?.title || 'יעד לא ידוע'}
                      </span>
                    ) : <span className="text-xs text-tertiary">-</span>}
                  </td>
                  <td>{f.reach}</td>
                  <td>{f.impact}</td>
                  <td>{f.confidence}</td>
                  <td>{f.effort}</td>
                  <td><span className={`badge ${i === 0 ? 'badge-green' : 'badge-blue'}`}>{f.rice}</span></td>
                  <td><span className="badge badge-yellow">{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Prioritization;
