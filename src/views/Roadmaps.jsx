import React, { useState, useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import {
  Plus, X, Check, MoreHorizontal, Zap, ArrowRight, Clock,
  MessageSquare, CheckCircle, AlertCircle, Trash2, Activity,
  ChevronDown, ChevronRight, Eye, EyeOff, Calendar
} from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import ProductBadge, { getProductColor } from '../components/ProductBadge';
import logger from '../utils/logger';
import './Roadmaps.css';

// ── Constants ──────────────────────────────────────────────────────────────
const QUARTERS = {
  'Q1': ['ינואר', 'פברואר', 'מרץ'],
  'Q2': ['אפריל', 'מאי', 'יוני'],
  'Q3': ['יולי', 'אוגוסט', 'ספטמבר'],
  'Q4': ['אוקטובר', 'נובמבר', 'דצמבר'],
};

const ICON_MAP = {
  Zap: <Zap size={18} />,
  ArrowRight: <ArrowRight size={18} />,
  Clock: <Clock size={18} />,
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1.5px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  padding: '0.5rem 0.75rem',
  fontFamily: 'var(--font-family)',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  direction: 'rtl',
};

// ── Team Timeline View ─────────────────────────────────────────────────────
// Shows ALL products' items for a given Q+Year. Per-product toggle built-in.
const TeamTimelineView = ({
  board,
  allItems,         // all roadmap items for this Q+Year timeframe
  products,
  selectedProductIds,
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  data,
  isCompact,
}) => {
  const months = QUARTERS[board?.quarter || 'Q3'] || [];
  const year = board?.year || '2026';

  // Which products are hidden inside timeline
  const [hiddenProducts, setHiddenProducts] = useState([]);
  // Which product groups are collapsed (squashed)
  const [collapsedProducts, setCollapsedProducts] = useState([]);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: '', startMonth: 0, duration: 1,
    status: 'In Progress', teams: [],
    product_id: data.activeProductId || '',
  });

  // Edit form state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const toggleHide = (pid) =>
    setHiddenProducts(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);

  const toggleCollapse = (pid) =>
    setCollapsedProducts(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);

  // Group items by product, filtering hidden ones
  const groupedItems = useMemo(() => {
    const visible = allItems.filter(it => !hiddenProducts.includes(it.product_id));
    return products
      .filter(p => selectedProductIds.includes(p.id))
      .map(p => ({
        product: p,
        items: visible.filter(it => it.product_id === p.id),
      }))
      .filter(g => g.items.length > 0 || !hiddenProducts.includes(g.product.id));
  }, [allItems, products, selectedProductIds, hiddenProducts]);

  const handleAdd = () => {
    if (!newBlock.title.trim()) return;
    addRoadmapItem({
      ...newBlock,
      bucket: 'Timeline',
      board_id: board.id,
      quarter: board.quarter,
      year: board.year,
    });
    setNewBlock({ title: '', startMonth: 0, duration: 1, status: 'In Progress', teams: [], product_id: data.activeProductId || '' });
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editForm?.title?.trim()) return;
    updateRoadmapItem(editingId, editForm);
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className={`timeline-container animate-fade-in ${isCompact ? 'is-compact' : ''}`}>
      <div className="timeline-grid">
        {/* Header */}
        <div className="timeline-header-quarter text-h3 font-bold">{board?.quarter} {year}</div>
        {months.map(m => (
          <div key={m} className="timeline-month-header text-secondary">{m}</div>
        ))}

        {/* Rows grouped by product */}
        <div className="timeline-rows">
          {groupedItems.map(({ product, items }) => {
            const col = getProductColor(product.id);
            const collapsed = collapsedProducts.includes(product.id);
            const hidden = hiddenProducts.includes(product.id);
            if (hidden) return null;

            return (
              <div key={product.id} className="product-timeline-group">
                {/* Product group header */}
                <div
                  className="product-group-header flex-between cursor-pointer"
                  style={{ borderRight: `4px solid ${col.border}`, background: col.bg + '55' }}
                  onClick={() => toggleCollapse(product.id)}
                >
                  <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', direction: 'rtl' }}>
                    <span className="text-xs font-bold" style={{ color: col.text }}>{product.name}</span>
                    <span className="text-[10px] text-tertiary">({items.length} פריטים)</span>
                  </div>
                  {collapsed
                    ? <ChevronRight size={14} className="text-tertiary" />
                    : <ChevronDown size={14} className="text-tertiary" />
                  }
                </div>

                {/* Items */}
                {!collapsed && items.map(item => {
                  const start = item.start_month ?? 0;
                  const duration = Math.max(1, item.duration ?? 1);
                  if (editingId === item.id) {
                    return (
                      <div key={item.id} className="glass-panel p-2 my-2 animate-fade-in" style={{ direction: 'rtl', borderRight: `4px solid ${col.border}` }}>
                        <div className="flex gap-2 items-center w-full">
                          <input 
                            style={{ ...inputStyle, flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem', height: '32px' }} 
                            value={editForm.title} 
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })} 
                            placeholder="כותרת" 
                          />
                          <select 
                            style={{ ...inputStyle, width: '90px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', height: '32px' }} 
                            value={editForm.duration} 
                            onChange={e => setEditForm({ ...editForm, duration: parseFloat(e.target.value) })}
                          >
                            {[0.5, 1, 2, 3].map(v => <option key={v} value={v}>{v} חודש</option>)}
                          </select>
                          <select 
                            style={{ ...inputStyle, width: '100px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', height: '32px' }} 
                            value={editForm.startMonth} 
                            onChange={e => setEditForm({ ...editForm, startMonth: parseInt(e.target.value) })}
                          >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                          </select>
                          <div className="flex gap-1 mr-2">
                            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', height: '32px' }} onClick={() => setEditingId(null)}>ביטול</button>
                            <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', height: '32px' }} onClick={handleSaveEdit}><Check size={12} /> שמור</button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="timeline-row">
                      <div className="timeline-slot" />
                      <div className="timeline-slot" />
                      <div className="timeline-slot" />
                      <div
                        className="roadmap-block group"
                        style={{
                          right: `calc(${(start / 3) * 100}% + 8px)`,
                          width: `calc(${(duration / 3) * 100}% - 16px)`,
                          left: 'auto',
                          background: 'var(--bg-primary)',
                          borderRight: `4px solid ${col.border}`,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="flex-between items-center">
                          <div className="roadmap-block-title flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                            <span className="timeline-product-dot" style={{ background: col.border }} />
                            {item.status === 'Completed Successfully' && <CheckCircle size={10} className="text-emerald-400" />}
                            {item.status === 'Failed' && <AlertCircle size={10} className="text-red-400" />}
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.title}</span>
                          </div>
                          <div className="flex-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="btn-icon-xs text-tertiary" onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditForm({ title: item.title, startMonth: item.start_month ?? 0, duration: item.duration ?? 1 }); }}>
                              <Check size={10} />
                            </button>
                            <button className="btn-icon-xs text-red-400" onClick={e => { e.stopPropagation(); deleteRoadmapItem(item.id); }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                        {!isCompact && (
                          <div className="flex-between mt-1 items-center">
                            <span className="text-[10px] font-medium" style={{ color: col.border }}>{product.name}</span>
                            <div className="status-quick-toggle flex-center gap-1">
                              <button className={`status-dot ${item.status === 'Completed Successfully' ? 'active emerald' : ''}`} onClick={e => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Completed Successfully' }); }} title="הצלחה">{item.status === 'Completed Successfully' && <Check />}</button>
                              <button className={`status-dot ${item.status === 'Failed' ? 'active red' : ''}`} onClick={e => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'Failed' }); }} title="כשלון">{item.status === 'Failed' && <X />}</button>
                              <button className={`status-dot ${!item.status || item.status === 'In Progress' ? 'active blue' : ''}`} onClick={e => { e.stopPropagation(); updateRoadmapItem(item.id, { status: 'In Progress' }); }} title="בתהליך">{(!item.status || item.status === 'In Progress') && <Activity />}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Add new item row */}
        {showAdd ? (
          <div className="glass-panel p-4 animate-fade-in" style={{ gridColumn: '1 / -1', direction: 'rtl' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="text-xs text-secondary block mb-1">כותרת</label>
                <input style={inputStyle} value={newBlock.title} onChange={e => setNewBlock({ ...newBlock, title: e.target.value })} placeholder="פיתוח MVP..." />
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">מוצר</label>
                <select style={inputStyle} value={newBlock.product_id} onChange={e => setNewBlock({ ...newBlock, product_id: e.target.value })}>
                  {(data.products || []).filter(p => selectedProductIds.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">חודש התחלה</label>
                <select style={inputStyle} value={newBlock.startMonth} onChange={e => setNewBlock({ ...newBlock, startMonth: parseInt(e.target.value) })}>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">משך (חודשים)</label>
                <select style={inputStyle} value={newBlock.duration} onChange={e => setNewBlock({ ...newBlock, duration: parseFloat(e.target.value) })}>
                  {[0.5, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary block mb-1">סטטוס</label>
                <select style={inputStyle} value={newBlock.status} onChange={e => setNewBlock({ ...newBlock, status: e.target.value })}>
                  <option value="In Progress">בתהליך</option>
                  <option value="Completed Successfully">הושלם</option>
                  <option value="Failed">כישלון</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="text-xs text-secondary block mb-1">צוותים</label>
                <div className="flex gap-1 flex-wrap">
                  {(data.availableTeams || []).map(t => (
                    <button key={t} type="button"
                      className={`badge ${newBlock.teams?.includes(t) ? 'badge-blue' : 'badge-gray'}`}
                      style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                      onClick={() => {
                        const teams = newBlock.teams || [];
                        setNewBlock({ ...newBlock, teams: teams.includes(t) ? teams.filter(x => x !== t) : [...teams, t] });
                      }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleAdd}><Check size={16} /> הוספה</button>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>ביטול</button>
            </div>
          </div>
        ) : (
          <div className="flex-center py-4" style={{ gridColumn: '1 / -1' }}>
            <button className="timeline-add-btn" onClick={() => setShowAdd(true)} title="הוספת פריט"><Plus size={20} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Kanban View (Now / Next / Later) ──────────────────────────────────────
const KanbanView = ({
  board,
  kanbanItems,
  timelineBoards,
  products,
  data,
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  updateReviewStatus,
  searchTerm,
}) => {
  const [addingTo, setAddingTo] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', teams: [], product_id: data.activeProductId });
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardForm, setCardForm] = useState({ title: '', description: '', teams: [], product_id: data.activeProductId });
  const [promotingId, setPromotingId] = useState(null);
  const [promoteForm, setPromoteForm] = useState({ board_id: '', startMonth: 0, duration: 1 });

  const columns = board?.columns || [
    { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap', desc: 'עובדים על זה עכשיו' },
    { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight', desc: 'הדבר הבא בתור' },
    { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock', desc: 'רעיונות לטווח ארוך' },
  ];

  const handleAdd = (bucket) => {
    if (!form.title.trim()) return;
    addRoadmapItem({
      title: form.title,
      description: form.description,
      teams: form.teams,
      product_id: form.product_id || data.activeProductId,
      board_id: board?.id,
      bucket,
    });
    setForm({ title: '', description: '', teams: [], product_id: data.activeProductId });
    setAddingTo(null);
  };

  const handleSaveCardEdit = () => {
    if (!cardForm.title.trim()) return;
    updateRoadmapItem(editingCardId, cardForm);
    setEditingCardId(null);
  };

  const handlePromote = (item) => {
    const first = timelineBoards[0];
    setPromotingId(item.id);
    setPromoteForm({ board_id: first?.id || '', startMonth: 0, duration: 1 });
  };

  const confirmPromote = (itemId) => {
    const targetBoard = timelineBoards.find(b => b.id === promoteForm.board_id);
    updateRoadmapItem(itemId, {
      board_id: promoteForm.board_id,
      start_month: promoteForm.startMonth,
      duration: promoteForm.duration,
      bucket: 'Timeline',
      quarter: targetBoard?.quarter,
      year: targetBoard?.year,
    });
    setPromotingId(null);
  };

  return (
    <div className="kanban-board">
      {columns.map(({ key, label, icon, color, desc }) => {
        const items = kanbanItems.filter(r =>
          r.bucket === key && (
            r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        const isAdding = addingTo === key;
        const LucideIcon = ICON_MAP[icon] || <Zap size={18} />;

        return (
          <div key={key} className="kanban-column glass-panel">
            <div className="kanban-column-header">
              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
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
                const productName = products.find(p => p.id === item.product_id)?.name;
                const productCol = getProductColor(item.product_id);
                const reviews = (data.reviews || []).filter(r => r.item_id === item.id && r.status === 'Pending');

                return (
                  <div key={item.id} className="kanban-card-wrapper mb-3">
                    {editingCardId === item.id ? (
                      <div className="kanban-add-form">
                        <textarea autoFocus rows={1} style={{ ...inputStyle, resize: 'vertical', minHeight: '38px' }}
                          placeholder="כותרת..." value={cardForm.title}
                          onChange={e => setCardForm({ ...cardForm, title: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveCardEdit(); } if (e.key === 'Escape') setEditingCardId(null); }} />
                        <textarea style={{ ...inputStyle, marginTop: '0.5rem', resize: 'vertical', minHeight: '60px' }}
                          placeholder="תיאור..." value={cardForm.description}
                          onChange={e => setCardForm({ ...cardForm, description: e.target.value })} />
                        <div className="mt-2 flex gap-4">
                          <div style={{ flex: 1 }}>
                            <label className="text-[10px] text-tertiary block mb-1">מוצר</label>
                            <select style={{ ...inputStyle, height: '32px', padding: '0.25rem 0.5rem' }} value={cardForm.product_id} onChange={e => setCardForm({ ...cardForm, product_id: e.target.value })}>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="text-[10px] text-tertiary block mb-1">צוותים</label>
                            <div className="flex gap-1 flex-wrap">
                              {(data.availableTeams || []).map(t => (
                                <button key={t} type="button"
                                  className={`badge ${cardForm.teams?.includes(t) ? 'badge-blue' : 'badge-gray'}`}
                                  style={{ cursor: 'pointer', fontSize: '0.6rem' }}
                                  onClick={() => {
                                    const teams = cardForm.teams || [];
                                    setCardForm({ ...cardForm, teams: teams.includes(t) ? teams.filter(x => x !== t) : [...teams, t] });
                                  }}>{t}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={handleSaveCardEdit}><Check size={14} /> שמירה</button>
                          <button className="btn-icon" onClick={() => setEditingCardId(null)}><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className={`kanban-card`}>
                        {/* Promote modal */}
                        {promotingId === item.id && (
                          <div className="promoting-modal-mini p-3 mb-3" style={{ direction: 'rtl' }}>
                            <p className="text-xs font-bold mb-2 text-indigo-600">העברה לציר זמן</p>
                            <div className="mb-2">
                              <label className="text-[10px] opacity-70 block mb-1">ציר זמן (Q+שנה)</label>
                              <select style={{ ...inputStyle, height: '30px', padding: '0 5px', fontSize: '11px' }}
                                value={promoteForm.board_id}
                                onChange={e => setPromoteForm({ ...promoteForm, board_id: e.target.value })}>
                                {timelineBoards.map(b => (
                                  <option key={b.id} value={b.id}>{b.quarter} {b.year} {b.name ? `— ${b.name}` : ''}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 mb-2">
                              <div className="flex-1">
                                <label className="text-[10px] opacity-70">חודש</label>
                                <select style={{ ...inputStyle, height: '30px', padding: '0 5px' }}
                                  value={promoteForm.startMonth}
                                  onChange={e => setPromoteForm({ ...promoteForm, startMonth: parseInt(e.target.value) })}>
                                  {(QUARTERS[timelineBoards.find(b => b.id === promoteForm.board_id)?.quarter] || QUARTERS['Q3']).map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] opacity-70">משך</label>
                                <select style={{ ...inputStyle, height: '30px', padding: '0 5px' }}
                                  value={promoteForm.duration}
                                  onChange={e => setPromoteForm({ ...promoteForm, duration: parseFloat(e.target.value) })}>
                                  <option value={0.5}>0.5</option>
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="btn btn-primary text-xs flex-1 py-1" onClick={() => confirmPromote(item.id)}>אישור</button>
                              <button className="btn btn-secondary text-xs flex-1 py-1" onClick={() => setPromotingId(null)}>ביטול</button>
                            </div>
                          </div>
                        )}
                        <div className="card-header">
                          <div className="flex-center gap-2">
                            <span className={`badge badge-${color}`}>{label}</span>
                            <ProductBadge productName={productName} productId={item.product_id} />
                          </div>
                          <div className="flex-center gap-1">
                            {timelineBoards.length > 0 && (
                              <button className="btn-icon text-tertiary hover:text-indigo-500"
                                onClick={() => promotingId === item.id ? setPromotingId(null) : handlePromote(item)}
                                title="העבר לציר זמן">
                                <Zap size={18} />
                              </button>
                            )}
                            <button className="btn-icon text-tertiary hover:text-primary"
                              onClick={() => { setEditingCardId(item.id); setCardForm({ title: item.title, description: item.description || '', teams: item.teams || [], product_id: item.product_id || data.activeProductId }); }}
                              title="עריכה"><Check size={18} /></button>
                            <button className="btn-icon text-tertiary hover:text-danger"
                              onClick={() => deleteRoadmapItem(item.id)} title="מחיקה"><Trash2 size={18} /></button>
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="flex-center gap-1 mb-1" style={{ justifyContent: 'flex-start' }}>
                            {item.status === 'Completed Successfully' && <CheckCircle size={14} className="text-emerald-400" />}
                            {item.status === 'Failed' && <AlertCircle size={14} className="text-red-400" />}
                            <h4 className="card-title font-medium">{item.title}</h4>
                          </div>
                          {item.teams?.length > 0 && (
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {item.teams.map(t => <span key={t} className="badge" style={{ fontSize: '0.65rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', padding: '0.15rem 0.45rem' }}>{t}</span>)}
                            </div>
                          )}
                          {item.description && <p className="text-xs text-tertiary mt-1">{item.description}</p>}
                          <div className="status-quick-toggle flex-center gap-1 mt-3" style={{ justifyContent: 'flex-start' }}>
                            <button className={`status-dot ${item.status === 'Completed Successfully' ? 'active emerald' : ''}`} onClick={() => updateRoadmapItem(item.id, { status: 'Completed Successfully' })} title="הצלחה">{item.status === 'Completed Successfully' && <Check />}</button>
                            <button className={`status-dot ${item.status === 'Failed' ? 'active red' : ''}`} onClick={() => updateRoadmapItem(item.id, { status: 'Failed' })} title="כישלון">{item.status === 'Failed' && <X />}</button>
                            <button className={`status-dot ${!item.status || item.status === 'In Progress' ? 'active blue' : ''}`} onClick={() => updateRoadmapItem(item.id, { status: 'In Progress' })} title="בתהליך">{(!item.status || item.status === 'In Progress') && <Activity />}</button>
                          </div>
                        </div>

                        {reviews.map(rev => (
                          <div key={rev.id} className="item-review-bubble mt-1 p-2 bg-yellow rounded text-[10px] flex-between" style={{ borderRight: '3px solid var(--status-warning)' }}>
                            <span className="flex-center gap-1"><MessageSquare size={10} /> {rev.content}</span>
                            <button className="btn-icon-xs" onClick={() => updateReviewStatus(rev.id, 'Resolved')}><Check size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isAdding ? (
                <div className="kanban-add-form">
                  <input autoFocus style={inputStyle} placeholder="כותרת..." value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(key); if (e.key === 'Escape') setAddingTo(null); }} />
                  <textarea style={{ ...inputStyle, marginTop: '0.5rem', resize: 'vertical', minHeight: '60px' }}
                    placeholder="תיאור (אופציונלי)..." value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                  <div className="mt-2 flex gap-4">
                    <div style={{ flex: 1 }}>
                      <label className="text-[10px] text-tertiary block mb-1">מוצר</label>
                      <select style={{ ...inputStyle, height: '32px', padding: '0.25rem 0.5rem' }} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="text-[10px] text-tertiary block mb-1">צוותים</label>
                      <div className="flex gap-1 flex-wrap">
                        {(data.availableTeams || []).map(t => (
                          <button key={t} type="button"
                            className={`badge ${form.teams?.includes(t) ? 'badge-blue' : 'badge-gray'}`}
                            style={{ cursor: 'pointer', fontSize: '0.6rem' }}
                            onClick={() => {
                              const teams = form.teams || [];
                              setForm({ ...form, teams: teams.includes(t) ? teams.filter(x => x !== t) : [...teams, t] });
                            }}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleAdd(key)}><Check size={14} /> הוספה</button>
                    <button className="btn-icon" onClick={() => { setAddingTo(null); setForm({ title: '', description: '', teams: [], product_id: data.activeProductId }); }}><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <button className="add-card-btn text-tertiary" onClick={() => { setAddingTo(key); setForm({ title: '', description: '', teams: [], product_id: data.activeProductId }); }}>
                  <Plus size={16} /> הוספת פריט
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Roadmaps Component ───────────────────────────────────────────────
const Roadmaps = () => {
  const {
    data,
    activeProduct,
    products,
    selectedProductIds,
    addRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    roadmapBoards,
    activeRoadmapBoard,
    setActiveRoadmapBoard,
    updateReviewStatus,
    loading,
    searchTerm,
  } = useProductContext();

  // Mode: 'timeline' | 'kanban'
  const [mode, setMode] = useState('timeline');
  const [isCompact, setIsCompact] = useState(false);

  const allBoards = roadmapBoards || [];
  const timelineBoards = allBoards.filter(b => b.view_type === 'timeline');
  const kanbanBoards = allBoards.filter(b => b.view_type === 'kanban');

  // Unique timeframes for timeline (Q+Year combos), deduplicated
  const timeframes = Array.from(
    new Map(
      timelineBoards.map(b => [`${b.quarter}-${b.year}`, b])
    ).values()
  ).sort((a, b) => {
    const qa = parseInt(a.quarter?.replace('Q', '') || '1');
    const qb = parseInt(b.quarter?.replace('Q', '') || '1');
    return (parseInt(a.year || '2026') * 10 + qa) - (parseInt(b.year || '2026') * 10 + qb);
  });

  // Currently selected timeline board
  const activeTimeline = mode === 'timeline'
    ? (timelineBoards.find(b => b.id === activeRoadmapBoard?.id) || timeframes[0])
    : null;

  // Currently selected kanban board
  const activeKanban = mode === 'kanban'
    ? (kanbanBoards.find(b => b.id === activeRoadmapBoard?.id) || kanbanBoards[0])
    : null;

  const allRoadmapItems = data?.roadmaps || [];

  const timelineItems = useMemo(() => {
    if (!activeTimeline) return [];
    return allRoadmapItems.filter(it =>
      it.quarter === activeTimeline.quarter &&
      it.year === activeTimeline.year &&
      it.bucket === 'Timeline' &&
      selectedProductIds.includes(it.product_id)
    );
  }, [allRoadmapItems, activeTimeline, selectedProductIds]);

  const kanbanItems = useMemo(() => {
    if (!activeKanban) return [];
    return allRoadmapItems.filter(it =>
      it.board_id === activeKanban.id &&
      it.bucket !== 'Timeline' &&
      selectedProductIds.includes(it.product_id)
    );
  }, [allRoadmapItems, activeKanban, selectedProductIds]);

  const visibleProducts = (products || []).filter(p => selectedProductIds.includes(p.id));

  // Early return AFTER all hooks
  if (!activeProduct) return null;

  logger.debug('Roadmaps render', { mode, timeframes: timeframes.length, timelineItems: timelineItems.length, kanbanItems: kanbanItems.length });

  return (
    <div className="content-area animate-fade-in roadmaps-layout">
      <header className="page-header" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 className="text-h1 mb-1">מפת דרכים</h1>
          <p className="text-secondary text-sm">ניהול תוכנית עבודה</p>
        </div>

        <div className="flex-center gap-3" style={{ flexWrap: 'wrap' }}>
          {/* Mode toggle — pill switcher */}
          <div className="roadmap-mode-toggle">
            <button
              className={`roadmap-mode-btn ${mode === 'timeline' ? 'active' : ''}`}
              onClick={() => setMode('timeline')}
            >
              <Calendar size={14} />
              <span>ציר זמן</span>
            </button>
            <button
              className={`roadmap-mode-btn ${mode === 'kanban' ? 'active' : ''}`}
              onClick={() => setMode('kanban')}
            >
              <MoreHorizontal size={14} />
              <span>Now / Next / Later</span>
            </button>
          </div>

          {mode === 'timeline' && (
            <button
              className={`btn btn-secondary flex-center gap-2 ${isCompact ? 'border-indigo-400 text-indigo-600' : ''}`}
              style={{ height: '38px' }}
              onClick={() => setIsCompact(!isCompact)}
              title={isCompact ? 'תצוגה רגילה' : 'תצוגה דחוסה'}
            >
              <MoreHorizontal size={16} style={{ transform: isCompact ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              {isCompact ? 'דחוס' : 'רגיל'}
            </button>
          )}

          {/* Board / Timeframe selector */}
          {!loading && (
            <div className="flex-center gap-2">
              <span className="text-sm text-secondary">{mode === 'timeline' ? 'רבעון:' : 'לוח Kanban:'}</span>
              <select
                className="modal-input"
                style={{ width: '180px', height: '38px', padding: '0 0.75rem' }}
                value={mode === 'timeline' ? activeTimeline?.id : activeKanban?.id}
                onChange={e => setActiveRoadmapBoard(e.target.value)}
              >
                {mode === 'timeline'
                  ? timeframes.map(b => (
                      <option key={b.id} value={b.id}>{b.quarter} {b.year}</option>
                    ))
                  : kanbanBoards.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                }
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Product selector row */}
      <div className="flex justify-center mb-4">
        <MultiProductSelector />
      </div>

      {/* Views */}
      {mode === 'timeline' ? (
        activeTimeline ? (
          <TeamTimelineView
            board={activeTimeline}
            allItems={timelineItems}
            products={visibleProducts}
            selectedProductIds={selectedProductIds}
            addRoadmapItem={addRoadmapItem}
            updateRoadmapItem={updateRoadmapItem}
            deleteRoadmapItem={deleteRoadmapItem}
            data={data}
            isCompact={isCompact}
          />
        ) : (
          <div className="glass-panel p-10 text-center animate-fade-in" style={{ direction: 'rtl' }}>
            <Calendar size={48} className="text-tertiary mx-auto mb-4" />
            <h3 className="text-h3 mb-2">אין ציר זמן צוותי</h3>
            <p className="text-secondary mb-4">צור ציר זמן (Timeline) ראשון בהגדרות</p>
          </div>
        )
      ) : (
        activeKanban ? (
          <KanbanView
            board={activeKanban}
            kanbanItems={kanbanItems}
            timelineBoards={timelineBoards}
            products={visibleProducts}
            data={data}
            addRoadmapItem={addRoadmapItem}
            updateRoadmapItem={updateRoadmapItem}
            deleteRoadmapItem={deleteRoadmapItem}
            updateReviewStatus={updateReviewStatus}
            searchTerm={searchTerm || ''}
          />
        ) : (
          <div className="glass-panel p-10 text-center animate-fade-in" style={{ direction: 'rtl' }}>
            <MoreHorizontal size={48} className="text-tertiary mx-auto mb-4" />
            <h3 className="text-h3 mb-2">אין לוח Kanban</h3>
            <p className="text-secondary mb-4">צור לוח Kanban בהגדרות</p>
          </div>
        )
      )}
    </div>
  );
};

export default Roadmaps;
