import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Users, Plus, Trash2, ChevronDown, ChevronUp, MessageSquarePlus, X, Check, User, Building, Search, Calendar, Filter, Heart, AlertCircle, Smile, Activity, Edit2 } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import ProductBadge from '../components/ProductBadge';
import './Customers.css';

const SEGMENTS = ['כלל הלקוחות', 'Enterprise', 'SMB', 'Self-serve'];
const HEALTH_STATUS = [
  { key: 'happy', label: 'מרוצה', color: 'success', icon: <Smile size={14}/> },
  { key: 'neutral', label: 'נייטרלי', color: 'tertiary', icon: <Heart size={14}/> },
  { key: 'risk', label: 'בסיכון', color: 'danger', icon: <AlertCircle size={14}/> }
];

const UserCard = ({ user, customers, productName, onDelete, onAddNote, onUpdate, onDeleteNote, onUpdateNote }) => {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const customerName = customers.find(c => c.id === user.customer_id)?.name || 'ללא חברה';

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    const res = await onAddNote(user.id, noteText);
    if (res?.success || res === undefined) { // Fallback for undefined if caller doesn't return
      setNoteText('');
      setShowNoteInput(false);
    } else {
      alert('שגיאה בשמירת ההערה: ' + res.error);
    }
  };

  const handleUpdate = () => {
    onUpdate(user.id, editForm);
    setIsEditing(false);
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingNoteText.trim()) return;
    const res = await onUpdateNote(user.id, noteId, editingNoteText);
    if (res?.success || res === undefined) {
      setEditingNoteId(null);
      setEditingNoteText('');
    } else {
      alert('שגיאה בעדכון ההערה: ' + res.error);
    }
  };

  if (isEditing) {
    const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.4rem 0.6rem', borderRadius:'var(--border-radius-sm)', fontSize:'0.85rem' };
    return (
      <div className="customer-card glass-panel p-4 animate-fade-in">
        <div className="flex-between mb-3">
          <h4 className="font-semibold text-sm">עריכת משתמש</h4>
          <button className="btn-icon" onClick={() => setIsEditing(false)}><X size={16}/></button>
        </div>
        <div style={{ display:'grid', gap:'0.8rem' }}>
          <div><label className="text-xs text-tertiary block mb-1">שם מלא</label><input type="text" style={inputStyle} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">חברה (לקוח)</label>
            <select style={inputStyle} value={editForm.customer_id} onChange={e => setEditForm({...editForm, customer_id: e.target.value})}>
              <option value="">בחר חברה...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select>
          </div>
          <div><label className="text-xs text-tertiary block mb-1">תפקיד</label><input type="text" style={inputStyle} value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">אימייל</label><input type="email" style={inputStyle} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">מה המשתמש רוצה/צריך</label><textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={editForm.needs} onChange={e => setEditForm({...editForm, needs: e.target.value})}/></div>
        </div>
        <div className="flex-center gap-2 mt-4" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn-primary btn-sm" onClick={handleUpdate}><Check size={14}/> שמירה</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>ביטול</button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-card glass-panel">
      <div className="customer-card-header">
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
          <div className="customer-avatar i-bg-blue mt-1">
            <User size={18} />
          </div>
          <div>
            <div className="mb-1" style={{ display: 'flex', justifyContent: 'flex-start' }}>
               <ProductBadge productName={productName} productId={user.product_id} />
               <span className="text-[10px] text-tertiary uppercase font-bold ml-2">משתמש קצה</span>
            </div>
            <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
               <h4 className="font-semibold" style={{ margin: 0, lineHeight: 1.2 }}>{user.name}</h4>
               {user.role && <span className="text-xs text-secondary">• {user.role}</span>}
            </div>
            <p className="text-xs text-tertiary mt-1"><Building size={10} style={{display:'inline', verticalAlign:'middle', marginLeft:'3px'}}/> {customerName}</p>
          </div>
        </div>
        <div className="flex-center gap-1">
          <button className="btn-icon" title="עריכה" onClick={() => setIsEditing(true)}><Check size={14} /></button>
          <button className="btn-icon" title="הוספת הערה" onClick={() => { setShowNoteInput(!showNoteInput); setExpanded(true); }}><MessageSquarePlus size={16} /></button>
          <button className="btn-icon" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          <button className="btn-icon text-danger" title="מחיקה" onClick={() => onDelete(user.id)}><Trash2 size={15} /></button>
        </div>
      </div>

      {user.email && <p className="text-xs text-secondary mt-1" style={{ paddingRight: '3.5rem' }}>{user.email}</p>}
      
      {user.needs && (
        <div className="mt-2 text-sm text-secondary bg-white/5 p-2 px-3 m-2 mr-14 rounded-md italic" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
          "{user.needs}"
        </div>
      )}

      {expanded && (
        <div className="customer-notes mt-3">
          <h5 className="text-sm font-semibold mb-2 text-secondary">פידבק והערות משתמש</h5>
          {showNoteInput && (
            <div className="note-input-row mb-3">
              <textarea autoFocus rows={2} style={{ width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.5rem 0.7rem', borderRadius:'var(--border-radius-sm)', resize:'vertical', direction:'rtl', fontSize:'0.875rem' }} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="מה המשתמש אמר?" />
              <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start' }}>
                <button className="btn btn-primary" style={{ padding:'0.3rem 0.7rem', fontSize:'0.78rem' }} onClick={handleSaveNote}><Check size={13}/> שמירה</button>
                <button className="btn-icon" onClick={() => setShowNoteInput(false)}><X size={14}/></button>
              </div>
            </div>
          )}
          {(user.notes || []).length === 0 && !showNoteInput ? (
            <p className="text-xs text-tertiary">אין הערות משתמש עדיין.</p>
          ) : (
            <div className="notes-timeline">
              {(user.notes || []).map(n => (
                <div key={n.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    {editingNoteId === n.id ? (
                      <div className="note-edit-row">
                        <textarea 
                          rows={2} 
                          style={{ width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.5rem 0.7rem', borderRadius:'var(--border-radius-sm)', resize:'vertical', direction:'rtl', fontSize:'0.875rem', marginBottom: '0.5rem' }} 
                          value={editingNoteText} 
                          onChange={e => setEditingNoteText(e.target.value)} 
                        />
                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                          <button className="btn btn-primary" style={{ padding:'0.3rem 0.7rem', fontSize:'0.78rem' }} onClick={() => handleUpdateNote(n.id)}><Check size={13}/> עדכון</button>
                          <button className="btn-icon" onClick={() => setEditingNoteId(null)}><X size={14}/></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{n.text}</p>
                        <div className="flex-between mt-1">
                          <span className="text-xs text-tertiary">{new Date(n.createdAt).toLocaleDateString('he-IL')}</span>
                          <div className="flex-center gap-1">
                            <button 
                              className="btn-icon" 
                              style={{ height: '20px', width: '20px' }} 
                              onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.text); }}
                              title="עריכה"
                            >
                              <Edit2 size={12}/>
                            </button>
                            <button className="btn-icon text-danger" style={{ height: '20px', width: '20px' }} onClick={() => onDeleteNote(user.id, n.id)} title="מחיקה"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FeedbackTimeline = ({ customers, productUsers, selectedProductIds, products }) => {
  const allNotes = [];
  
  customers.forEach(c => {
    (c.notes || []).forEach(n => {
      allNotes.push({ ...n, type: 'customer', entity: c });
    });
  });
  
  productUsers.forEach(u => {
    (u.notes || []).forEach(n => {
      allNotes.push({ ...n, type: 'user', entity: u });
    });
  });
  
  const sorted = allNotes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return (
    <div className="feedback-timeline glass-panel p-6 animate-fade-in">
      <h3 className="text-h3 mb-6">ציר זמן של פידבק והערות</h3>
      {sorted.length === 0 ? (
        <p className="text-secondary">אין הערות עדיין לסנן.</p>
      ) : (
        <div className="notes-timeline big">
          {sorted.map((item, idx) => {
            const prodName = products.find(p => p.id === item.entity.product_id)?.name;
            return (
              <div key={idx} className="timeline-item big">
                <div className="timeline-dot big" />
                <div className="timeline-content big">
                  <div className="flex-between mb-2">
                    <div className="flex-center gap-2">
                       <div className={`icon-badge-xs ${item.type === 'customer' ? 'i-bg-pink' : 'i-bg-blue'}`}>
                         {item.type === 'customer' ? <Building size={12}/> : <User size={12}/>}
                       </div>
                       <span className="font-semibold text-sm">{item.entity.name}</span>
                       <span className="text-xs text-tertiary">• {item.type === 'customer' ? 'לקוח' : 'משתמש'}</span>
                    </div>
                    <div className="text-xs text-tertiary flex-center gap-2">
                      <ProductBadge productName={prodName} productId={item.entity.product_id} />
                      {new Date(item.createdAt).toLocaleDateString('he-IL', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                  <p className="text-md leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CustomerCard = ({ customer, productName, onDelete, onAddNote, onUpdate, onDeleteNote, onUpdateNote }) => {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...customer });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    const res = await onAddNote(customer.id, noteText);
    if (res?.success || res === undefined) {
      setNoteText('');
      setShowNoteInput(false);
    } else {
      alert('שגיאה בשמירת ההערה: ' + res.error);
    }
  };

  const handleUpdate = () => {
    onUpdate(customer.id, editForm);
    setIsEditing(false);
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingNoteText.trim()) return;
    const res = await onUpdateNote(customer.id, noteId, editingNoteText);
    if (res?.success || res === undefined) {
      setEditingNoteId(null);
      setEditingNoteText('');
    } else {
      alert('שגיאה בעדכון ההערה: ' + res.error);
    }
  };

  if (isEditing) {
    const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.4rem 0.6rem', borderRadius:'var(--border-radius-sm)', fontSize:'0.85rem' };
    return (
      <div className="customer-card glass-panel p-4 animate-fade-in">
        <div className="flex-between mb-3">
          <h4 className="font-semibold">עריכת לקוח</h4>
          <button className="btn-icon" onClick={() => setIsEditing(false)}><X size={16}/></button>
        </div>
        <div style={{ display:'grid', gap:'0.8rem' }}>
          <div><label className="text-xs text-tertiary block mb-1">שם מלא</label><input type="text" style={inputStyle} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">חברה</label><input type="text" style={inputStyle} value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">אימייל</label><input type="email" style={inputStyle} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">סגמנט</label>
            <select style={inputStyle} value={editForm.segment} onChange={e => setEditForm({...editForm, segment: e.target.value})}>
              {['Enterprise','SMB','Self-serve'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-tertiary block mb-1">מצב בריאות (Health)</label>
            <select style={inputStyle} value={editForm.health || 'neutral'} onChange={e => setEditForm({...editForm, health: e.target.value})}>
              {HEALTH_STATUS.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-tertiary block mb-1">תיאור</label><textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">צרכים ורצונות</label><textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={editForm.wants} onChange={e => setEditForm({...editForm, wants: e.target.value})}/></div>
        </div>
        <div className="flex-center gap-2 mt-4" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn-primary btn-sm" onClick={handleUpdate}><Check size={14}/> שמירה</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>ביטול</button>
        </div>
      </div>
    );
  }

  const currentHealth = HEALTH_STATUS.find(h => h.key === (customer.health || 'neutral'));

  return (
    <div className={`customer-card glass-panel ${expanded ? 'expanded' : ''}`}>
      <div className="customer-card-header">
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
          <div className="customer-avatar i-bg-pink mt-1">
            <Building size={18} />
          </div>
          <div>
            <div className="mb-1" style={{ display: 'flex', justifyContent: 'flex-start' }}>
               <ProductBadge productName={productName} productId={customer.product_id} />
               <div className={`badge badge-${currentHealth.color} ml-2`} style={{ fontSize:'10px', padding:'1px 6px', display:'flex', alignItems:'center', gap:'3px' }}>
                 {currentHealth.icon} {currentHealth.label}
               </div>
            </div>
            <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
               <h4 className="font-semibold" style={{ margin: 0, lineHeight: 1.2 }}>{customer.name}</h4>
            </div>
            <p className="text-xs text-tertiary mt-1">{customer.company} · {customer.segment || 'Enterprise'}</p>
          </div>
        </div>
        <div className="flex-center gap-1">
          <button className="btn-icon" title="עריכה" onClick={() => setIsEditing(true)}><Check size={14} /></button>
          <button className="btn-icon" title="הוספת הערה" onClick={() => { setShowNoteInput(!showNoteInput); setExpanded(true); }}><MessageSquarePlus size={16} /></button>
          <button className="btn-icon" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          <button className="btn-icon text-danger" title="מחיקה" onClick={() => onDelete(customer.id)}><Trash2 size={15} /></button>
        </div>
      </div>

      {customer.email && <p className="text-xs text-secondary mt-1" style={{ paddingRight: '3.5rem' }}>{customer.email}</p>}
      
      {customer.description && (
        <div className="mt-2 text-sm text-secondary" style={{ paddingRight: '3.5rem', fontStyle: 'italic' }}>
          {customer.description}
        </div>
      )}

      {expanded && (
        <div className="customer-notes mt-3">
          <h5 className="text-sm font-semibold mb-2 text-secondary">הערות לקוח</h5>

          {showNoteInput && (
            <div className="note-input-row mb-3">
              <textarea
                autoFocus rows={2}
                style={{ width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.5rem 0.7rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', resize:'vertical', direction:'rtl', fontSize:'0.875rem' }}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="מה הלקוח אמר? מה הוא רוצה?"
              />
              <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start' }}>
                <button className="btn btn-primary" style={{ padding:'0.3rem 0.7rem', fontSize:'0.78rem' }} onClick={handleSaveNote}><Check size={13}/> שמירה</button>
                <button className="btn-icon" onClick={() => setShowNoteInput(false)}><X size={14}/></button>
              </div>
            </div>
          )}

          {(customer.notes || []).length === 0 && !showNoteInput ? (
            <p className="text-xs text-tertiary">אין הערות עדיין. לחץ על ➕ להוספה.</p>
          ) : (
            <div className="notes-timeline">
              {(customer.notes || []).map(n => (
                <div key={n.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content" style={{ position: 'relative' }}>
                    {editingNoteId === n.id ? (
                      <div className="note-edit-row">
                        <textarea 
                          rows={2} 
                          style={{ width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.5rem 0.7rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', resize:'vertical', direction:'rtl', fontSize:'0.875rem', marginBottom:'0.5rem' }} 
                          value={editingNoteText} 
                          onChange={e => setEditingNoteText(e.target.value)} 
                        />
                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                          <button className="btn btn-primary" style={{ padding:'0.3rem 0.7rem', fontSize:'0.78rem' }} onClick={() => handleUpdateNote(n.id)}><Check size={13}/> עדכון</button>
                          <button className="btn-icon" onClick={() => setEditingNoteId(null)}><X size={14}/></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{n.text}</p>
                        <div className="flex-between mt-1">
                          <span className="text-xs text-tertiary">{new Date(n.createdAt).toLocaleDateString('he-IL')}</span>
                          <div className="flex-center gap-1">
                            <button 
                              className="btn-icon" 
                              style={{ height: '20px', width: '20px' }} 
                              onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.text); }}
                              title="עריכה"
                            >
                              <Edit2 size={12}/>
                            </button>
                            <button 
                              className="btn-icon text-danger" 
                              style={{ height: '20px', width: '20px' }} 
                              onClick={() => onDeleteNote(customer.id, n.id)}
                              title="מחיקת הערה"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {customer.wants && (
            <div className="customer-wants mt-3 bg-white/5 p-3 rounded-md mr-14" style={{ borderRight:'3px solid var(--accent-primary)' }}>
              <h5 className="text-xs font-bold mb-1 text-tertiary uppercase">מה הם רוצים / צרכים</h5>
              <p className="text-sm text-secondary leading-relaxed">{customer.wants}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Customers = () => {
  const { 
    activeProduct, activeCustomers, activeProductUsers, data, 
    addCustomer, addCustomerNote, deleteCustomer, updateCustomer, deleteCustomerNote, updateCustomerNote,
    addProductUser, updateProductUser, deleteProductUser, addProductUserNote, deleteProductUserNote, updateProductUserNote,
    selectedProductIds, products 
  } = useProductContext();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'customers' | 'users'
  const [showForm, setShowForm] = useState(false);
  const [filterSeg, setFilterSeg] = useState('כלל הלקוחות');
  const [searchTermLocal, setSearchTermLocal] = useState('');
  
  const [customerForm, setCustomerForm] = useState({ name:'', company:'', email:'', segment:'Enterprise', wants:'', description:'', health:'neutral' });
  const [userForm, setUserForm] = useState({ name:'', customer_id:'', role:'', email:'', needs:'' });

  if (!activeProduct) return null;

  const filteredCustomers = (filterSeg === 'כלל הלקוחות' ? activeCustomers : activeCustomers.filter(c => c.segment === filterSeg))
    .filter(c => c.name.toLowerCase().includes(searchTermLocal.toLowerCase()) || c.company.toLowerCase().includes(searchTermLocal.toLowerCase()));
    
  const filteredUsers = activeProductUsers
    .filter(u => u.name.toLowerCase().includes(searchTermLocal.toLowerCase()) || u.role?.toLowerCase().includes(searchTermLocal.toLowerCase()));

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    addCustomer({ ...customerForm, product_id: activeProduct.id });
    setCustomerForm({ name:'', company:'', email:'', segment:'Enterprise', wants:'', description:'', health:'neutral' });
    setShowForm(false);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim()) return;
    addProductUser({ ...userForm, product_id: activeProduct.id });
    setUserForm({ name:'', customer_id:'', role:'', email:'', needs:'' });
    setShowForm(false);
  };

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in customers-layout">
      <header className="page-header sticky top-0 bg-inherit z-10 pb-4">
        <div>
          <h1 className="text-h1 mb-2">לקוחות ומשתמשים</h1>
          <p className="text-secondary text-lg">ניהול דאטה, פידבק וצרכי משתמשים</p>
        </div>
        <div className="flex gap-2">
          {activeTab !== 'feed' && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <Plus size={18} /> {showForm ? 'ביטול' : (activeTab === 'customers' ? 'לקוח חדש' : 'משתמש חדש')}
            </button>
          )}
        </div>
      </header>

      <MultiProductSelector />

      {/* Main Tabs */}
      <div className="tabs-container mb-6">
        <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <Activity size={16} /> פידבק (Timeline)
        </button>
        <button className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <Building size={16} /> לקוחות (Entities)
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> משתמשי קצה (Users)
        </button>
      </div>

      {/* Global search and filter */}
      {activeTab !== 'feed' && (
        <div className="flex-between mb-6 gap-4 flex-wrap">
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder={activeTab === 'customers' ? "חפש לקוח או חברה..." : "חפש משתמש..."} 
              value={searchTermLocal}
              onChange={e => setSearchTermLocal(e.target.value)}
            />
          </div>
          
          {activeTab === 'customers' && (
            <div className="flex-center gap-2">
              <Filter size={16} className="text-tertiary" />
              {SEGMENTS.map(s => (
                <button key={s} className={`badge ${filterSeg===s?'badge-blue':'badge-gray'} cursor-pointer`} onClick={() => setFilterSeg(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Forms */}
      {showForm && activeTab === 'customers' && (
        <form onSubmit={handleAddCustomer} className="glass-panel p-6 mb-6 animate-slide-up">
          <h3 className="text-h3 mb-4">יצירת ישות לקוח (חברה)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}><label className="text-sm text-secondary block mb-1">שם הארגון / לקוח *</label><input required autoFocus type="text" style={inputStyle} value={customerForm.name} onChange={e => setCustomerForm({...customerForm,name:e.target.value})} placeholder="למשל: בנק לאומי"/></div>
            <div><label className="text-sm text-secondary block mb-1">חברה (יישות משפטית)</label><input type="text" style={inputStyle} value={customerForm.company} onChange={e => setCustomerForm({...customerForm,company:e.target.value})} placeholder="שם החברה"/></div>
            <div><label className="text-sm text-secondary block mb-1">אימייל ראשי</label><input type="email" style={inputStyle} value={customerForm.email} onChange={e => setCustomerForm({...customerForm,email:e.target.value})} placeholder="contact@example.com"/></div>
            <div><label className="text-sm text-secondary block mb-1">סגמנט</label>
              <select style={inputStyle} value={customerForm.segment} onChange={e => setCustomerForm({...customerForm,segment:e.target.value})}>
                {['Enterprise','SMB','Self-serve'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-sm text-secondary block mb-1">מצב בריאות (Health)</label>
              <select style={inputStyle} value={customerForm.health} onChange={e => setCustomerForm({...customerForm,health:e.target.value})}>
                {HEALTH_STATUS.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">צרכים ורצונות עיקריים</label>
              <textarea rows={3} style={{...inputStyle, resize:'vertical'}} value={customerForm.wants} onChange={e => setCustomerForm({...customerForm,wants:e.target.value})} placeholder="מה הם הכאבים הכי גדולים שלהם?"/>
            </div>
          </div>
          <div className="mt-4"><button type="submit" className="btn btn-primary"><Check size={16}/> צור לקוח</button></div>
        </form>
      )}

      {showForm && activeTab === 'users' && (
        <form onSubmit={handleAddUser} className="glass-panel p-6 mb-6 animate-slide-up">
          <h3 className="text-h3 mb-4">הוספת משתמש קצה</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div><label className="text-sm text-secondary block mb-1">שם המשתמש *</label><input required autoFocus type="text" style={inputStyle} value={userForm.name} onChange={e => setUserForm({...userForm,name:e.target.value})} placeholder="שם מלא"/></div>
            <div><label className="text-sm text-secondary block mb-1">חברה משויכת *</label>
              <select required style={inputStyle} value={userForm.customer_id} onChange={e => setUserForm({...userForm, customer_id: e.target.value})}>
                <option value="">בחר לקוח...</option>
                {activeCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm text-secondary block mb-1">תפקיד</label><input type="text" style={inputStyle} value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} placeholder="למשל: CTO"/></div>
            <div><label className="text-sm text-secondary block mb-1">אימייל</label><input type="email" style={inputStyle} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="email@user.com"/></div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">ביקשות / צרכים אישיים</label>
              <textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={userForm.needs} onChange={e => setUserForm({...userForm, needs: e.target.value})} placeholder="מה המשתמש הזה ספציפית צריך?"/>
            </div>
          </div>
          <div className="mt-4"><button type="submit" className="btn btn-primary"><Check size={16}/> הוסף משתמש</button></div>
        </form>
      )}

      {/* Main Content Area */}
      <div className="tab-content">
        {activeTab === 'feed' && (
          <FeedbackTimeline 
            customers={activeCustomers} 
            productUsers={activeProductUsers} 
            selectedProductIds={selectedProductIds}
            products={products}
          />
        )}

        {activeTab === 'customers' && (
          filteredCustomers.length === 0 ? (
            <div className="empty-state glass-panel p-10"><Building size={48} className="text-tertiary mb-4"/><h3 className="text-h3">אין לקוחות תואמים</h3><button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>הוסף לקוח</button></div>
          ) : (
            <div className="customers-grid">
              {filteredCustomers.map(c => (
                <CustomerCard 
                  key={c.id} 
                  customer={c} 
                  productName={selectedProductIds.length > 1 ? products.find(p => p.id === c.product_id)?.name : null}
                  onDelete={deleteCustomer} 
                  onAddNote={addCustomerNote} 
                  onUpdate={updateCustomer} 
                  onDeleteNote={deleteCustomerNote}
                  onUpdateNote={updateCustomerNote}
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'users' && (
          filteredUsers.length === 0 ? (
            <div className="empty-state glass-panel p-10"><User size={48} className="text-tertiary mb-4"/><h3 className="text-h3">אין משתמשים תואמים</h3><button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>הוסף משתמש</button></div>
          ) : (
            <div className="customers-grid">
              {filteredUsers.map(u => (
                <UserCard 
                  key={u.id} 
                  user={u}
                  customers={activeCustomers}
                  productName={selectedProductIds.length > 1 ? products.find(p => p.id === u.product_id)?.name : null}
                  onDelete={deleteProductUser}
                  onAddNote={addProductUserNote}
                  onUpdate={updateProductUser}
                  onDeleteNote={deleteProductUserNote}
                  onUpdateNote={updateProductUserNote}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Customers;
