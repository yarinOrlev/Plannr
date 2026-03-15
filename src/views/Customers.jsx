import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Users, Plus, Trash2, ChevronDown, ChevronUp, MessageSquarePlus, X, Check, User } from 'lucide-react';
import './Customers.css';

const SEGMENTS = ['כלל הלקוחות', 'Enterprise', 'SMB', 'Self-serve'];

const CustomerCard = ({ customer, onDelete, onAddNote, onUpdate, onDeleteNote }) => {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...customer });

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote(customer.id, noteText);
    setNoteText('');
    setShowNoteInput(false);
  };

  const handleUpdate = () => {
    onUpdate(customer.id, editForm);
    setIsEditing(false);
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
          <div><label className="text-xs text-tertiary block mb-1">תיאור</label><textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}/></div>
          <div><label className="text-xs text-tertiary block mb-1">מה הם רוצים</label><textarea rows={2} style={{...inputStyle, resize:'vertical'}} value={editForm.wants} onChange={e => setEditForm({...editForm, wants: e.target.value})}/></div>
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
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
          <div className="customer-avatar i-bg-pink">
            <User size={18} />
          </div>
          <div>
            <h4 className="font-semibold">{customer.name}</h4>
            <p className="text-xs text-tertiary">{customer.company} · {customer.segment || 'Enterprise'}</p>
          </div>
        </div>
        <div className="flex-center gap-1">
          <button className="btn-icon" title="עריכה" onClick={() => setIsEditing(true)}>
            <Check size={14} />
          </button>
          <button className="btn-icon" title="הוספת הערה" onClick={() => { setShowNoteInput(!showNoteInput); setExpanded(true); }}>
            <MessageSquarePlus size={16} />
          </button>
          <button className="btn-icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="btn-icon text-danger" title="מחיקה" onClick={() => onDelete(customer.id)}>
            <Trash2 size={15} />
          </button>
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
          {/* ... existing notes logic ... */}

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
                    <p className="text-sm">{n.text}</p>
                    <div className="flex-between mt-1">
                      <span className="text-xs text-tertiary">{new Date(n.createdAt).toLocaleDateString('he-IL')}</span>
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
                </div>
              ))}
            </div>
          )}

          {customer.wants && (
            <div className="customer-wants mt-3">
              <h5 className="text-sm font-semibold mb-1 text-secondary">מה הם רוצים</h5>
              <p className="text-sm text-secondary">{customer.wants}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Customers = () => {
  const { activeProduct, activeCustomers, addCustomer, addCustomerNote, deleteCustomer, updateCustomer, deleteCustomerNote } = useProductContext();
  const [showForm, setShowForm] = useState(false);
  const [filterSeg, setFilterSeg] = useState('כלל הלקוחות');
  const [form, setForm] = useState({ name:'', company:'', email:'', segment:'Enterprise', wants:'', description:'' });

  if (!activeProduct) return null;

  const filtered = filterSeg === 'כלל הלקוחות'
    ? activeCustomers
    : activeCustomers.filter(c => c.segment === filterSeg);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addCustomer(form);
    setForm({ name:'', company:'', email:'', segment:'Enterprise', wants:'', description:'' });
    setShowForm(false);
  };

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in customers-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">לקוחות</h1>
          <p className="text-secondary text-lg">
            ניהול לקוחות עבור <strong className="text-primary">{activeProduct.name}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'ביטול' : 'לקוח חדש'}
        </button>
      </header>

      {/* Segment filter */}
      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
        {SEGMENTS.map(s => (
          <button key={s} className={`btn ${filterSeg===s?'btn-primary':'btn-secondary'}`} style={{ padding:'0.3rem 0.75rem', fontSize:'0.8rem' }} onClick={() => setFilterSeg(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel p-6 animate-fade-in">
          <div className="flex-between mb-4">
            <h3 className="text-h3">לקוח חדש</h3>
            <button type="button" className="btn-icon" onClick={() => setShowForm(false)}><X size={18}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
            <div><label className="text-sm text-secondary block mb-1">שם מלא *</label><input required autoFocus type="text" style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="שם הלקוח"/></div>
            <div><label className="text-sm text-secondary block mb-1">חברה</label><input type="text" style={inputStyle} value={form.company} onChange={e => setForm({...form,company:e.target.value})} placeholder="שם החברה"/></div>
            <div><label className="text-sm text-secondary block mb-1">אימייל</label><input type="email" style={inputStyle} value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="email@example.com"/></div>
            <div><label className="text-sm text-secondary block mb-1">סגמנט</label>
              <select style={inputStyle} value={form.segment} onChange={e => setForm({...form,segment:e.target.value})}>
                {['Enterprise','SMB','Self-serve'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">תיאור קצר</label>
              <input type="text" style={inputStyle} value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="כמה מילים על הלקוח..."/>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label className="text-sm text-secondary block mb-1">מה הם רוצים / צרכיהם</label>
              <textarea rows={3} style={{...inputStyle, resize:'vertical'}} value={form.wants} onChange={e => setForm({...form,wants:e.target.value})} placeholder="תאר את הצרכים העיקריים של הלקוח..."/>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-start', marginTop:'1.25rem' }}>
            <button type="submit" className="btn btn-primary"><Check size={16}/> הוספת לקוח</button>
          </div>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="text-tertiary mb-4"/>
          <h3 className="text-h3 mb-2">אין לקוחות עדיין</h3>
          <p className="text-secondary mb-4">הוסף לקוחות כדי לעקוב אחר הצרכים וההערות שלהם.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> לקוח ראשון</button>
        </div>
      ) : (
        <div className="customers-grid">
          {filtered.map(c => (
            <CustomerCard 
              key={c.id} 
              customer={c} 
              onDelete={deleteCustomer} 
              onAddNote={addCustomerNote} 
              onUpdate={updateCustomer} 
              onDeleteNote={deleteCustomerNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
