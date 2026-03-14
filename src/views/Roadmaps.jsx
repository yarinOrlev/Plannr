import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Plus, X, Check, MoreHorizontal, Zap, ArrowRight, Clock } from 'lucide-react';
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

const TimelineView = ({ activeRoadmaps, board, activeFeatures, addRoadmapItem }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', startMonth: 0, duration: 1, featureId: '' });
  
  const currentMonths = QUARTERS[board.quarter || 'Q3'];
  const year = board.year || '2026';

  const handleAdd = () => {
    if (!newBlock.title.trim()) return;
    addRoadmapItem({ 
      ...newBlock, 
      bucket: 'Timeline', // Legacy field compatibility
      quarter: board.quarter,
      year: board.year
    });
    setNewBlock({ title: '', startMonth: 0, duration: 1, featureId: '' });
    setShowAdd(false);
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
          {activeRoadmaps.map(item => (
            <div key={item.id} className="timeline-row">
              <div className="timeline-slot"></div>
              <div className="timeline-slot"></div>
              <div className="timeline-slot"></div>
              <div 
                className="roadmap-block i-bg-purple"
                style={{ 
                  left: `calc(${(item.startMonth / 3) * 100}% + 8px)`, 
                  width: `calc(${(item.duration / 3) * 100}% - 16px)`,
                  right: 'auto'
                }}
              >
                <div className="flex-between">
                  <div className="roadmap-block-title">{item.title}</div>
                  {(data.reviews || []).filter(r => r.item_id === item.id && r.status === 'Pending').length > 0 && (
                    <div className="item-review-indicator" title="הערות מנהל פתוחות">
                      <MessageSquare size={10} />
                    </div>
                  )}
                </div>
                {item.featureId && (
                  <div className="roadmap-block-meta">
                    <Check size={10} style={{ display:'inline', marginLeft:4 }}/>
                    {activeFeatures.find(f => f.id === item.featureId)?.title}
                  </div>
                )}
              </div>
            </div>
          ))}

          {showAdd ? (
            <div className="glass-panel p-4 animate-fade-in" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem' }}>
                <div>
                  <label className="text-xs text-secondary block mb-1">כותרת הבלוק</label>
                  <input style={inputStyle} value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} placeholder="למשל: פיתוח MVP..."/>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">חודש התחלה</label>
                  <select style={inputStyle} value={newBlock.startMonth} onChange={e => setNewBlock({...newBlock, startMonth: parseInt(e.target.value)})}>
                    {currentMonths.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">משך זמן (חודשים)</label>
                  <select style={inputStyle} value={newBlock.duration} onChange={e => setNewBlock({...newBlock, duration: parseInt(e.target.value)})}>
                    <option value={1}>חודש אחד (קצר)</option>
                    <option value={2}>חודשיים (בינוני)</option>
                    <option value={3}>שלושה חודשים (ארוך)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">קישור לפיצ'ר</label>
                  <select style={inputStyle} value={newBlock.featureId} onChange={e => setNewBlock({...newBlock, featureId: e.target.value})}>
                    <option value="">ללא קישור</option>
                    {activeFeatures.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
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
      </div>
    </div>
  );
};

const Roadmaps = () => {
  const { activeRoadmaps, activeProduct, addRoadmapItem, roadmapBoards, activeRoadmapBoard, setActiveRoadmapBoard, activeFeatures, data, updateReviewStatus } = useProductContext();
  const [addingTo, setAddingTo] = useState(null);
  const [form, setForm] = useState({ title:'', description:'' });

  if (!activeProduct) return null;

  const handleAdd = (bucket) => {
    if (!form.title.trim()) return;
    addRoadmapItem({ title:form.title, description:form.description, bucket });
    setForm({ title:'', description:'' });
    setAddingTo(null);
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
          data={data}
          updateReviewStatus={updateReviewStatus}
        />
      ) : (
        <div className="kanban-board">
          {(activeRoadmapBoard?.columns || []).map(({ key, label, icon, color, desc }) => {
            const items = activeRoadmaps.filter(r => r.bucket === key);
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
                        <div className="kanban-card">
                          <div className="card-header">
                            <span className={`badge badge-${color}`}>{label}</span>
                            <button className="btn-icon text-tertiary"><MoreHorizontal size={16}/></button>
                          </div>
                          <div className="card-body">
                            <h4 className="card-title font-medium">{item.title}</h4>
                            {item.description && <p className="text-xs text-tertiary mt-1">{item.description}</p>}
                          </div>
                        </div>
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
