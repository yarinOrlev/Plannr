import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Plus, ChevronDown, ChevronUp, ChevronsUpDown, X, Check, Info, Pencil, Trash2, Settings, Sliders, AlertCircle } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import ProductBadge from '../components/ProductBadge';
import './Prioritization.css';

const Prioritization = () => {
  const { 
    activeFeatures, 
    activeProduct, 
    data, 
    addFeature, 
    updateFeature, 
    deleteFeature, 
    availableTeams, 
    activeObjectives, 
    searchTerm, 
    selectedProductIds,
    updateScoringConfig
  } = useProductContext();

  const [sortKey, setSortKey] = useState('totalScore');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: '', objective_id: '', teams: [], productIds: [] });
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [featureMetrics, setFeatureMetrics] = useState({});

  if (!activeProduct) return null;

  const scoringConfig = data.scoringConfig || [];
  const teams = availableTeams || [];
  const objectives = activeObjectives || [];

  const calculateScore = (f, config) => {
    let multipliers = 1;
    let dividers = 1;
    
    config.forEach(c => {
      const val = f[c.id] || c.defaultValue || 0;
      const weightedVal = val * (c.weight || 1);
      
      if (c.type === 'divider') {
        dividers *= (weightedVal || 1);
      } else {
        multipliers *= weightedVal;
      }
    });
    
    return Math.round((multipliers / (dividers || 1)) * 10) / 10;
  };

  const getScoreColor = (score) => {
    if (score >= 200) return 'badge-pink';
    if (score >= 100) return 'badge-purple';
    if (score >= 50) return 'badge-indigo';
    if (score >= 20) return 'badge-blue';
    return 'badge-gray';
  };

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const toggleProduct = (pid) => {
    setSelectedProducts(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  const handleEdit = (f) => {
    const metrics = {};
    scoringConfig.forEach(c => {
      metrics[c.id] = f[c.id] || c.defaultValue;
    });
    
    setNewFeature({
      title: f.title,
      objective_id: f.objective_id || '',
      teams: f.teams || [],
      productIds: f.product_ids || [f.product_id]
    });
    setFeatureMetrics(metrics);
    setSelectedTeams(f.teams || []);
    setSelectedProducts(f.product_ids || [f.product_id]);
    setEditingId(f.id);
    setShowAddForm(true);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...activeFeatures]
    .filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(f => ({ ...f, totalScore: calculateScore(f, scoringConfig) }))
    .sort((a, b) => {
      const v = (sortDir === 'asc' ? 1 : -1);
      if (a[sortKey] > b[sortKey]) return v;
      if (a[sortKey] < b[sortKey]) return -v;
      return 0;
    });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newFeature.title.trim()) return;
    if (selectedProducts.length === 0) {
      alert('יש לבחור לפחות מוצר אחד');
      return;
    }
    
    const featureData = { 
      ...newFeature, 
      ...featureMetrics, 
      teams: selectedTeams,
      productIds: selectedProducts
    };

    if (editingId) {
      updateFeature(editingId, featureData);
    } else {
      addFeature({ ...featureData, status: 'Planned' });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewFeature({ title: '', objective_id: '', teams: [], productIds: [] });
    setFeatureMetrics({});
    setSelectedTeams([]);
    setSelectedProducts([activeProduct.id]);
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

  const inputStyle = { width: '100%', border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--border-radius-sm)', fontFamily: 'var(--font-family)', direction: 'rtl' };

  return (
    <div className="content-area animate-fade-in prioritization-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">תעדוף פיצ'רים</h1>
          <p className="text-secondary text-lg">תעדוף משימות ופיצ'רים לפי מודל ניקוד מותאם אישית</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            <Settings size={18}/> הגדרות ניקוד
          </button>
          <button className="btn btn-primary" onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}>
            <Plus size={18}/> {showAddForm ? 'ביטול' : 'הוספת פיצ\'ר'}
          </button>
        </div>
      </header>

      <MultiProductSelector />

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
                  <p>הציון מחושב על ידי מכפלת כל מדדי ה-<strong>Multiplier</strong> (כפול המשקל שלהם) וחילוק בתוצאת כל מדדי ה-<strong>Divider</strong>.</p>
                  <p className="mt-1 opacity-75">לדוגמה: (Reach × Impact) ÷ Effort</p>
                </div>
              </div>
            </div>
            
            <div className="settings-scroll-area" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '0.25rem' }}>
              <table className="prioritization-table mb-6">
                <thead>
                  <tr>
                    <th>שם המדד</th>
                    <th>סוג</th>
                    <th>משקל</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringConfig.map((config, index) => (
                    <tr key={config.id}>
                      <td>
                        <input 
                          className="premium-input text-sm" 
                          value={config.label} 
                          onChange={(e) => {
                            const newConfig = [...scoringConfig];
                            newConfig[index].label = e.target.value;
                            updateScoringConfig(newConfig);
                          }}
                        />
                      </td>
                      <td>
                        <select 
                          className="premium-input text-sm"
                          value={config.type}
                          onChange={(e) => {
                            const newConfig = [...scoringConfig];
                            newConfig[index].type = e.target.value;
                            updateScoringConfig(newConfig);
                          }}
                        >
                          <option value="multiplier">מכפיל (חיובי)</option>
                          <option value="divider">מחלק (שלילי/מאמץ)</option>
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-secondary opacity-50">x</span>
                          <input 
                            type="number" 
                            step="0.1"
                            className="premium-input text-sm" 
                            style={{ width: '80px' }}
                            value={config.weight} 
                            onChange={(e) => {
                              const newConfig = [...scoringConfig];
                              newConfig[index].weight = Number(e.target.value);
                              updateScoringConfig(newConfig);
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <button className="btn-icon text-danger" onClick={() => {
                          const newConfig = scoringConfig.filter((_, i) => i !== index);
                          updateScoringConfig(newConfig);
                        }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="btn btn-secondary w-full" onClick={() => {
                const newId = `custom_${Date.now()}`;
                updateScoringConfig([...scoringConfig, { id: newId, label: 'מדד חדש', weight: 1, type: 'multiplier', defaultValue: 1 }]);
              }}>
                <Plus size={16} /> הוספת מדד חדש
              </button>
            </div>

            <div className="modal-footer-premium mt-8">
              <button className="btn btn-primary btn-lg w-full" onClick={() => setShowSettings(false)}>סגור ושמור</button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-panel p-6 mb-4 animate-fade-in edit-form-container">
          <div className="flex-between mb-4">
            <div className="flex-center gap-2">
              <h3 className="text-h3">{editingId ? 'עריכת פיצ\'ר' : 'פיצ\'ר חדש'}</h3>
            </div>
            <button type="button" className="btn-icon" onClick={resetForm}><X size={18}/></button>
          </div>
          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1.5rem' }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="input-label-premium">שם הפיצ'ר</label>
              <input type="text" autoFocus required className="premium-input" value={newFeature.title} onChange={e => setNewFeature({...newFeature, title:e.target.value})} placeholder="לדוגמה: ייצוא פעילות משתמשים"/>
            </div>

            <div style={{ gridColumn: '1 / -1' }} className="form-section-premium">
              <label className="input-label-premium mb-3">שיוך למוצרים</label>
              <div className="flex gap-2 flex-wrap">
                {data.products.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`badge-premium ${selectedProducts.includes(p.id) ? 'active' : ''}`}
                  >
                    {p.name}
                    {selectedProducts.includes(p.id) ? <Check size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
                  </button>
                ))}
              </div>
            </div>

            {scoringConfig.map((c) => (
              <div key={c.id}>
                <label className="input-label-premium flex-center gap-1 mb-1" style={{ justifyContent: 'flex-start' }}>
                  {c.label}
                  {c.info && (
                    <div className="info-tooltip-trigger" title={c.info}>
                      <Info size={14} className="text-tertiary" />
                    </div>
                  )}
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  className="premium-input" 
                  value={featureMetrics[c.id] || c.defaultValue || 1} 
                  onChange={e => setFeatureMetrics({...featureMetrics, [c.id]: Number(e.target.value)})}
                />
              </div>
            ))}

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label-premium">יעד קשור (OKR)</label>
              <select 
                className="premium-input" 
                value={newFeature.objective_id} 
                onChange={e => setNewFeature({...newFeature, objective_id: e.target.value})}
              >
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
            <button type="submit" className="btn btn-primary btn-lg"><Check size={20}/> {editingId ? 'עדכון פיצ\'ר' : 'שמירת פיצ\'ר'}</button>
          </div>
        </form>
      )}

      <div className="prioritization-container glass-panel">
        <div className="table-responsive">
          <table className="prioritization-table">
            <thead>
              <tr>
                <th style={{ textAlign:'right' }}>שם הפיצ'ר</th>
                <th>מוצרים</th>
                <th>OKR</th>
                {scoringConfig.map(c => (
                  <th key={c.id} style={{ whiteSpace:'nowrap' }}>
                    <div className="flex-center gap-1" style={{ cursor:'pointer' }} onClick={() => handleSort(c.id)}>
                      {c.label}
                      <SortIcon k={c.id}/>
                    </div>
                  </th>
                ))}
                <th style={{ whiteSpace:'nowrap' }}>
                  <div className="flex-center gap-1" style={{ cursor:'pointer' }} onClick={() => handleSort('totalScore')}>
                    ציון משוקלל
                    <SortIcon k="totalScore"/>
                  </div>
                </th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.id} className={editingId === f.id ? 'editing-row' : ''}>
                  <td className="font-medium" style={{ minWidth: '180px', maxWidth: '300px' }}>
                    <div className="flex-col">
                      <p className="text-secondary mb-2 rtl text-right" style={{ whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: '500' }}>
                        {f.title}
                      </p>
                      <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.75rem' }}>
                        {(Array.isArray(f.teams) ? f.teams : (f.teams ? f.teams.split(',') : [])).map(t => (
                          <span key={t} className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', cursor: 'default' }}>
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(f.product_ids || [f.product_id]).map(pid => (
                        <ProductBadge key={pid} productName={data.products.find(p => p.id === pid)?.name || '?'} productId={pid} />
                      ))}
                    </div>
                  </td>
                  <td style={{ minWidth: '180px', maxWidth: '300px' }}>
                    {f.objective_id ? (
                      <p className="text-secondary text-xs leading-relaxed rtl text-right" style={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                        {objectives.find(o => o.id === f.objective_id)?.title || '-'}
                      </p>
                    ) : <span className="text-xs text-tertiary">-</span>}
                  </td>
                  {scoringConfig.map(c => (
                    <td key={c.id} className="text-center">{f[c.id] || c.defaultValue}</td>
                  ))}
                  <td className="text-center">
                    <span className={`badge ${getScoreColor(f.totalScore)} score-badge font-bold`}>
                      {f.totalScore}
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
                  <td colSpan={scoringConfig.length + 5} className="text-center py-12">
                    <div className="flex-center flex-col text-tertiary">
                      <AlertCircle size={40} className="mb-2 opacity-20" />
                      <p>לא נמצאו פיצ'רים התואמים את הסינון</p>
                    </div>
                  </td>
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
