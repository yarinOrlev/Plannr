import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Plus, X, Check, MoreHorizontal, Zap, ArrowRight, Clock, MessageSquare, CheckCircle, AlertCircle, Trash2, Activity } from 'lucide-react';
import logger from '../utils/logger';
import './Roadmaps.css';

const ICON_MAP = {
  Zap: <Zap size={18}/>,
  ArrowRight: <ArrowRight size={18}/>,
  Clock: <Clock size={18}/>,
  Calendar: <Zap size={18}/>, // Fallback
};

const inputStyle = {
  width:'100%', background:'var(--bg-secondary)', border:'1.5px solid var(--border-color)',
  borderRadius:'var(--border-radius-sm)', padding:'0.5rem 0.75rem',
  fontFamily:'var(--font-family)', fontSize:'0.875rem', color:'var(--text-primary)', direction:'rtl',
};

const QUARTERS = {
  'Q1': ['ינואר', 'פברואר', 'מרץ'],
  'Q2': ['אפריל', 'מאי', 'יוני'],
  'Q3': ['יולי', 'אוגוסט', 'ספטמבר'],
  'Q4': ['אוקטובר', 'נובמבר', 'דצמבר']
};

const TimelineView = ({ activeRoadmaps, board, activeFeatures, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem, data, updateReviewStatus }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', startMonth: 0, duration: 1, featureId: '', status: 'In Progress', teams: [] });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  
  const currentMonths = QUARTERS[board.quarter || 'Q3'];
  const year = board.year || '2026';
  const { searchTerm } = useProductContext();

  const filteredRoadmaps = activeRoadmaps.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!newBlock.title.trim()) return;
    addRoadmapItem({ 
      ...newBlock, 
      bucket: 'Timeline', // Legacy field compatibility
      quarter: board.quarter,
      year: board.year
    });
    setNewBlock({ title: '', startMonth: 0, duration: 1, featureId: '', status: 'In Progress', teams: [] });
    setShowAdd(false);
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditForm({ 
      title: item.title, 
      startMonth: item.startMonth || item.start_month || 0, 
      duration: item.duration || 1, 
      featureId: item.featureId || '', 
      status: item.status || 'In Progress',
      teams: item.teams || []
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) return;
    updateRoadmapItem(editingItemId, editForm);
    setEditingItemId(null);
    setEditForm(null);
  };

  return (
    <div className="timeline-container animate-fade-in">
      <div className="timeline-grid">
        <div className="timeline-header-quarter text-h3 font-bold">
          {board.quarter} {year}
        </div>
        {currentMonths.map(m => (
          <div key={m} className="timeline-month-header text-secondary">{m}</div>
        ))}
        
        <div className="timeline-rows">
          {filteredRoadmaps.map(item => {
            const start = item.start_month ?? item.startMonth ?? 0;
            const duration = item.duration ?? 1;
            return (
              <div key={item.id} className="timeline-row">
                <div className="timeline-slot"></div>
                <div className="timeline-slot"></div>
                <div className="timeline-slot"></div>
                <div 
                  className={`roadmap-block i-bg-purple status-${(item.status || 'In Progress').toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ 
                    right: `calc(${(start / 3) * 100}% + 8px)`, 
                    width: `calc(${(duration / 3) * 100}% - 16px)`,
                    left: 'auto',
                    borderRight: item.status === 'Completed Successfully' ? '4px solid #10b981' : (item.status === 'Failed' ? '4px solid #ef4444' : 'none')
                  }}
                >
                  <div className="flex-between items-center">
                    <div className="roadmap-block-title flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      {item.status === 'Completed Successfully' && <CheckCircle size={12} className="text-emerald-400" />}
                      {item.status === 'Failed' && <AlertCircle size={12} className="text-red-400" />}
                      {item.title}
                    </div>
                    <div className="flex-center gap-1">
                      {(item.teams || []).map(t => (
                        <span key={t} className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>{t}</span>
                      ))}
                      {(data.reviews || []).filter(r => r.item_id === item.id && r.status === 'Pending').length > 0 && (
                        <div className="item-review-indicator" title="הערות מנהל פתוחות">
                          <MessageSquare size={10} />
                        </div>
                      )}
                      <button className="btn-icon-xs text-white" style={{ background: 'rgba(0,0,0,0.1)' }} title="עריכה" onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}>
                        <Check size={14}/>
                      </button>
                      <button className="btn-icon-xs text-white" style={{ background: 'rgba(0,0,0,0.1)' }} title="מחיקה" onClick={(e) => { e.stopPropagation(); deleteRoadmapItem(item.id); }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex-between mt-1 items-end">
                    {item.featureId ? (
                      <div className="roadmap-block-meta">
                        <Check size={10} style={{ display:'inline', marginLeft:4 }}/>
                        {activeFeatures.find(f => f.id === item.featureId)?.title}
                      </div>
                    ) : <div />}
                    <div className="status-quick-toggle flex-center gap-1">
                      <button 
                        className={`status-dot ${item.status === 'Completed Successfully' ? 'active emerald' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Completed Successfully' }); }}
                        title="סמן כהצלחה"
                      >
                        {item.status === 'Completed Successfully' && <Check />}
                      </button>
                      <button 
                        className={`status-dot ${item.status === 'Failed' ? 'active red' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Failed' }); }}
                        title="סמן ככשלון"
                      >
                        {item.status === 'Failed' && <X />}
                      </button>
                      <button 
                        className={`status-dot ${item.status === 'In Progress' || !item.status ? 'active blue' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'In Progress' }); }}
                        title="בתהליך"
                      >
                        {(item.status === 'In Progress' || !item.status) && <Activity />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showAdd ? (
          <div className="glass-panel p-4 animate-fade-in" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem' }}>
              <div>
                <label className="text-xs text-secondary block mb-1">כותרת הבלוק</label>
                <textarea rows={1} style={{...inputStyle, resize: 'vertical', minHeight: '38px'}} value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} placeholder="למשל: פיתוח MVP..."/>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">חודש התחלה</label>
                <select style={inputStyle} value={newBlock.startMonth} onChange={e => setNewBlock({...newBlock, startMonth: parseInt(e.target.value)})}>
                  {currentMonths.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">משך זמן</label>
                <select style={inputStyle} value={newBlock.duration} onChange={e => setNewBlock({...newBlock, duration: parseFloat(e.target.value)})}>
                  <option value={0.25}>שבוע (0.25 חודש)</option>
                  <option value={0.5}>שבועיים (0.5 חודש)</option>
                  <option value={0.75}>3 שבועות (0.75 חודש)</option>
                  <option value={1}>חודש (1)</option>
                  <option value={2}>חודשיים (2)</option>
                  <option value={3}>3 חודשים (Q)</option>
                  <option value={6}>6 חודשים (2Q)</option>
                  <option value={12}>12 חודשים (שנה)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">סטטוס</label>
                <select style={inputStyle} value={newBlock.status} onChange={e => setNewBlock({...newBlock, status: e.target.value})}>
                  <option value="In Progress">בתהליך</option>
                  <option value="Completed Successfully">הושלם בהצלחה</option>
                  <option value="Failed">נכשל / בעיות</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">קישור לפיצ'ר</label>
                <select style={inputStyle} value={newBlock.featureId} onChange={e => setNewBlock({...newBlock, featureId: e.target.value})}>
                  <option value="">ללא קישור</option>
                  {activeFeatures.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="text-xs text-secondary block mb-1">צוותים מעורבים</label>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                  {data.availableTeams?.map(team => (
                    <button
                      key={team}
                      type="button"
                      className={`badge ${newBlock.teams?.includes(team) ? 'badge-blue' : 'badge-gray'}`}
                      style={{ cursor:'pointer', fontSize:'0.7rem' }}
                      onClick={() => {
                        const teams = newBlock.teams || [];
                        setNewBlock({...newBlock, teams: teams.includes(team) ? teams.filter(t => t !== team) : [...teams, team]});
                      }}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-center gap-2 mt-4" style={{ justifyContent:'flex-start' }}>
              <button className="btn btn-primary" onClick={handleAdd}><Check size={16}/> שמירה</button>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>ביטול</button>
            </div>
          </div>
        ) : (
          <div className="flex-center py-4" style={{ gridColumn: '1 / -1' }}>
            <button className="timeline-add-btn" onClick={() => setShowAdd(true)} title="הוספת בלוק למפת הדרכים">
               <Plus size={20}/>
            </button>
          </div>
        )}
      </div>

      {editingItemId && editForm && (
        <div className="glass-panel p-4 animate-fade-in mt-6">
          <div className="flex-between mb-3">
            <h4 className="font-semibold text-primary">עריכת פריט</h4>
            <button className="btn-icon" onClick={() => setEditingItemId(null)}><X size={18}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem' }}>
            <div>
              <label className="text-xs text-secondary block mb-1">כותרת הבלוק</label>
              <textarea rows={1} style={{...inputStyle, resize: 'vertical', minHeight: '38px'}} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="למשל: פיתוח MVP..."/>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">חודש התחלה</label>
              <select style={inputStyle} value={editForm.startMonth} onChange={e => setEditForm({...editForm, startMonth: parseInt(e.target.value)})}>
                {currentMonths.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">משך זמן</label>
              <select style={inputStyle} value={editForm.duration} onChange={e => setEditForm({...editForm, duration: parseFloat(e.target.value)})}>
                <option value={0.25}>שבוע (0.25 חודש)</option>
                <option value={0.5}>שבועיים (0.5 חודש)</option>
                <option value={0.75}>3 שבועות (0.75 חודש)</option>
                <option value={1}>חודש (1)</option>
                <option value={2}>חודשיים (2)</option>
                <option value={3}>3 חודשים (Q)</option>
                <option value={6}>6 חודשים (2Q)</option>
                <option value={12}>12 חודשים (שנה)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">סטטוס</label>
              <select style={inputStyle} value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="In Progress">בתהליך</option>
                <option value="Completed Successfully">הושלם בהצלחה</option>
                <option value="Failed">נכשל / בעיות</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">קישור לפיצ'ר</label>
              <select style={inputStyle} value={editForm.featureId} onChange={e => setEditForm({...editForm, featureId: e.target.value})}>
                <option value="">ללא קישור</option>
                {activeFeatures.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs text-secondary block mb-1">צוותים מעורבים</label>
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                {data.availableTeams?.map(team => (
                  <button
                    key={team}
                    type="button"
                    className={`badge ${editForm.teams?.includes(team) ? 'badge-blue' : 'badge-gray'}`}
                    style={{ cursor:'pointer', fontSize:'0.7rem' }}
                    onClick={() => {
                      const teams = editForm.teams || [];
                      setEditForm({...editForm, teams: teams.includes(team) ? teams.filter(t => t !== team) : [...teams, team]});
                    }}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-center gap-2 mt-4" style={{ justifyContent:'flex-start' }}>
            <button className="btn btn-primary" onClick={handleSaveEdit}><Check size={16}/> שמירה</button>
            <button className="btn btn-secondary" onClick={() => setEditingItemId(null)}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Roadmaps = () => {
  const { activeRoadmaps, activeProduct, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem, roadmapBoards, activeRoadmapBoard, setActiveRoadmapBoard, activeFeatures, data, updateReviewStatus, loading, searchTerm } = useProductContext();
  const [addingTo, setAddingTo] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', teams: [] });
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardForm, setCardForm] = useState({ title:'', description:'', teams: [] });

  if (!activeProduct) return null;

  logger.debug('Rendering Roadmaps view', { 
    boardId: activeRoadmapBoard?.id, 
    viewType: activeRoadmapBoard?.view_type,
    itemsCount: activeRoadmaps?.length 
  });

  const handleAdd = (bucket) => {
    if (!form.title.trim()) return;
    addRoadmapItem({ title:form.title, description:form.description, teams: form.teams, bucket });
    setForm({ title:'', description:'', teams: [] });
    setAddingTo(null);
  };

  const handleStartCardEdit = (item) => {
    setEditingCardId(item.id);
    setCardForm({ title: item.title, description: item.description || '', teams: item.teams || [] });
  };

  const handleSaveCardEdit = () => {
    if (!cardForm.title.trim()) return;
    updateRoadmapItem(editingCardId, cardForm);
    setEditingCardId(null);
    setCardForm({ title:'', description:'', teams: [] });
  };

  const getReviews = (item_id) => (data.reviews || []).filter(r => r.item_id === item_id && r.status === 'Pending');

  return (
    <div className="content-area animate-fade-in roadmaps-layout">
      <header className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="text-h1 mb-2">{activeRoadmapBoard?.name || 'מפת דרכים'}</h1>
          <p className="text-secondary text-lg">ניהול תוכנית עבודה עבור <strong className="text-primary">{activeProduct?.name}</strong></p>
        </div>
        {!loading && (
          <div className="board-selector flex-center gap-3">
            <span className="text-sm text-secondary">בחר לוח:</span>
            <select 
              value={activeRoadmapBoard?.id} 
              onChange={e => setActiveRoadmapBoard(e.target.value)}
              className="modal-input"
              style={{ width: '200px', height: '38px', padding: '0 0.75rem' }}
            >
              {(roadmapBoards || []).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {activeRoadmapBoard?.view_type === 'timeline' ? (
        <TimelineView 
          board={activeRoadmapBoard} 
          activeRoadmaps={activeRoadmaps} 
          activeFeatures={activeFeatures}
          addRoadmapItem={addRoadmapItem}
          updateRoadmapItem={updateRoadmapItem}
          deleteRoadmapItem={deleteRoadmapItem}
          data={data}
          updateReviewStatus={updateReviewStatus}
        />
      ) : (
        <div className="kanban-board">
          {(activeRoadmapBoard?.columns || []).map(({ key, label, icon, color, desc }) => {
            const items = activeRoadmaps.filter(r => 
              r.bucket === key && (
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            );
            const isAdding = addingTo === key;
            const LucideIcon = ICON_MAP[icon] || <Zap size={18}/>;
            return (
              <div key={key} className="kanban-column glass-panel">
                <div className="kanban-column-header">
                  <div className="flex-center gap-2" style={{ justifyContent:'flex-start' }}>
                    <span className={`icon-badge-sm bg-${color}`}>{LucideIcon}</span>
                    <div>
                      <h3 className="text-base font-semibold">{label}</h3>
                      {desc && <p className="text-xs text-tertiary">{desc}</p>}
                    </div>
                  </div>
                  <span className="badge">{items.length}</span>
                </div>

                <div className="kanban-cards">
                  {items.map(item => {
                    const reviews = getReviews(item.id);
                    return (
                      <div key={item.id} className="kanban-card-wrapper mb-3">
                        {editingCardId === item.id ? (
                          <div className="kanban-add-form">
                            <textarea autoFocus rows={1} style={{...inputStyle, resize: 'vertical', minHeight: '38px'}} placeholder="כותרת..." value={cardForm.title}
                              onChange={e => setCardForm({...cardForm, title:e.target.value})}
                              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSaveCardEdit(); } if(e.key==='Escape') setEditingCardId(null); }}/>
                            <textarea style={{...inputStyle, marginTop:'0.5rem', resize:'vertical', minHeight:'60px'}}
                              placeholder="תיאור (אופציונלי)..." value={cardForm.description}
                              onChange={e => setCardForm({...cardForm, description:e.target.value})}/>
                            <div className="mt-2">
                              <label className="text-[10px] text-tertiary block mb-1">צוותים מעורבים</label>
                              <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                                {data.availableTeams?.map(team => (
                                  <button
                                    key={team}
                                    type="button"
                                    className={`badge ${cardForm.teams?.includes(team) ? 'badge-blue' : 'badge-gray'}`}
                                    style={{ cursor:'pointer', fontSize:'0.6rem', padding:'0.1rem 0.35rem' }}
                                    onClick={() => {
                                      const teams = cardForm.teams || [];
                                      setCardForm({...cardForm, teams: teams.includes(team) ? teams.filter(t => t !== team) : [...teams, team]});
                                    }}
                                  >
                                    {team}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex-center gap-2 mt-2" style={{ justifyContent:'flex-start' }}>
                              <button className="btn btn-primary" style={{ padding:'0.35rem 0.75rem', fontSize:'0.8rem' }} onClick={handleSaveCardEdit}>
                                <Check size={14}/> שמירה
                              </button>
                              <button className="btn-icon" onClick={() => setEditingCardId(null)}>
                                <X size={16}/>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`kanban-card status-${(item.status || 'In Progress').toLowerCase().replace(/\s+/g, '-')}`}
                               style={{ borderRight: item.status === 'Completed Successfully' ? '4px solid #10b981' : (item.status === 'Failed' ? '4px solid #ef4444' : 'none') }}>
                            <div className="card-header">
                              <span className={`badge badge-${color}`}>{label}</span>
                              <div className="flex-center gap-1">
                                <button className="btn-icon text-tertiary hover:text-primary" onClick={() => handleStartCardEdit(item)} title="עריכה"><Check size={18}/></button>
                                <button className="btn-icon text-tertiary hover:text-danger" onClick={() => deleteRoadmapItem(item.id)} title="מחיקה"><Trash2 size={18}/></button>
                                <button className="btn-icon text-tertiary"><MoreHorizontal size={18}/></button>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="flex-center gap-1 mb-1" style={{ justifyContent: 'flex-start' }}>
                                {item.status === 'Completed Successfully' && <CheckCircle size={14} className="text-emerald-400" />}
                                {item.status === 'Failed' && <AlertCircle size={14} className="text-red-400" />}
                                <h4 className="card-title font-medium">{item.title}</h4>
                              </div>
                              {item.teams?.length > 0 && (
                                <div className="flex-center gap-1 mb-3 flex-wrap" style={{ justifyContent: 'flex-start' }}>
                                  {item.teams.map(t => <span key={t} className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px' }}>{t}</span>)}
                                </div>
                              )}
                              {item.description && <p className="text-xs text-tertiary mt-1">{item.description}</p>}

                              <div className="status-quick-toggle flex-center gap-1 mt-3" style={{ justifyContent: 'flex-start' }}>
                                <button
                                  className={`status-dot ${item.status === 'Completed Successfully' ? 'active emerald' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Completed Successfully' }); }}
                                  title="סמן כהצלחה"
                                >
                                  {item.status === 'Completed Successfully' && <Check />}
                                </button>
                                <button
                                  className={`status-dot ${item.status === 'Failed' ? 'active red' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Failed' }); }}
                                  title="סמן ככשלון"
                                >
                                  {item.status === 'Failed' && <X />}
                                </button>
                                <button
                                  className={`status-dot ${item.status === 'In Progress' || !item.status ? 'active blue' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'In Progress' }); }}
                                  title="בתהליך"
                                >
                                  {(item.status === 'In Progress' || !item.status) && <Activity />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {reviews.map(rev => (
                          <div key={rev.id} className="item-review-bubble mt-1 p-2 bg-yellow rounded text-[10px] flex-between" style={{ borderRight: '3px solid var(--status-warning)' }}>
                            <span className="flex-center gap-1"><MessageSquare size={10}/> {rev.content}</span>
                            <button className="btn-icon-xs" title="סמן כטופל" onClick={() => updateReviewStatus(rev.id, 'Resolved')}><Check size={10}/></button>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {isAdding ? (
                    <div className="kanban-add-form">
                      <input autoFocus style={inputStyle} placeholder="כותרת..." value={form.title}
                        onChange={e => setForm({...form, title:e.target.value})}
                        onKeyDown={e => { if(e.key==='Enter') handleAdd(key); if(e.key==='Escape') setAddingTo(null); }}/>
                      <textarea style={{...inputStyle, marginTop:'0.5rem', resize:'vertical', minHeight:'60px'}}
                        placeholder="תיאור (אופציונלי)..." value={form.description}
                        onChange={e => setForm({...form, description:e.target.value})}/>
                      <div className="mt-2">
                        <label className="text-[10px] text-tertiary block mb-1">צוותים מעורבים</label>
                        <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                          {data.availableTeams?.map(team => (
                            <button
                              key={team}
                              type="button"
                              className={`badge ${form.teams?.includes(team) ? 'badge-blue' : 'badge-gray'}`}
                              style={{ cursor:'pointer', fontSize:'0.6rem', padding:'0.1rem 0.35rem' }}
                              onClick={() => {
                                const teams = form.teams || [];
                                setForm({...form, teams: teams.includes(team) ? teams.filter(t => t !== team) : [...teams, team]});
                              }}
                            >
                              {team}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-center gap-2 mt-2" style={{ justifyContent:'flex-start' }}>
                        <button className="btn btn-primary" style={{ padding:'0.35rem 0.75rem', fontSize:'0.8rem' }} onClick={() => handleAdd(key)}>
                          <Check size={14}/> הוספה
                        </button>
                        <button className="btn-icon" onClick={() => { setAddingTo(null); setForm({title:'',description:''}); }}>
                          <X size={16}/>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="add-card-btn text-tertiary" onClick={() => { setAddingTo(key); setForm({title:'',description:''}); }}>
                      <Plus size={16}/> הוספת פריט
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Roadmaps;
