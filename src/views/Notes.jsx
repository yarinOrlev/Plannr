import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { StickyNote, Plus, Trash2, Tag, X, Pencil } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Notes.css';

const TAGS = ['כללי','רעיון','החלטה','סיכון','מעקב'];

const Notes = () => {
  const { activeProduct, activeNotes, data, addNote, updateNote, deleteNote, selectedProductIds } = useProductContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', tag:'כללי' });
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterTag, setFilterTag] = useState('הכל');

  if (!activeProduct) return null;

  const filtered = filterTag === 'הכל' ? activeNotes : activeNotes.filter(n => n.tag === filterTag);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    setIsSaving(true);
    try {
      let res;
      if (editingId) {
        res = await updateNote(editingId, form);
      } else {
        res = await addNote({ ...form, product_id: activeProduct.id });
      }

      if (res.success) {
        setForm({ title:'', content:'', tag:'כללי' });
        setShowForm(false);
        setEditingId(null);
      } else {
        alert('שגיאה בשמירת ההערה: ' + res.error);
      }
    } catch (err) {
      alert('שגיאה לא צפויה: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (note) => {
    setForm({ title: note.title, content: note.content || '', tag: note.tag || 'כללי' });
    setEditingId(note.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm({ title:'', content:'', tag:'כללי' });
    setEditingId(null);
    setShowForm(false);
  };

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in notes-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">הערות</h1>
          <p className="text-secondary text-lg">רעיונות, החלטות ומעקב</p>
        </div>
        <button className={`btn ${showForm ? 'btn-danger-soft' : 'btn-primary'}`} onClick={() => showForm ? cancelEdit() : setShowForm(true)}>
          {showForm ? <X size={18}/> : <Plus size={18}/>} {showForm?'ביטול':'הערה חדשה'}
        </button>
      </header>

      <MultiProductSelector />

      <div className="notes-tags mb-6" style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
        {['הכל',...TAGS].map(t => (
          <button key={t} className={`btn ${filterTag===t?'btn-primary':'btn-secondary'}`} style={{ padding:'0.3rem 0.8rem', fontSize:'0.78rem' }} onClick={() => setFilterTag(t)}>{t}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel p-6 mb-6 animate-fade-in" style={{ borderRight: editingId ? '4px solid var(--accent-primary)' : 'none' }}>
          <div className="flex-between mb-4">
             <div className="flex-center gap-2">
                <h3 className="text-h3">{editingId ? 'עריכת הערה' : 'הערה חדשה'}</h3>
                <span className="badge badge-indigo">{activeProduct.name}</span>
             </div>
             {editingId && <button type="button" className="btn-icon" onClick={cancelEdit}><X size={18}/></button>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div><label className="text-sm text-secondary block mb-1">כותרת</label><input autoFocus required type="text" style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="כותרת ההערה..."/></div>
            <div><label className="text-sm text-secondary block mb-1">תוכן</label><textarea rows={4} style={{...inputStyle, resize:'vertical'}} value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="כתוב את מחשבותיך..."/></div>
            <div><label className="text-sm text-secondary block mb-1">תגית</label><select style={inputStyle} value={form.tag} onChange={e => setForm({...form,tag:e.target.value})}>{TAGS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'שומר...' : 'שמירה'}
              </button>
              {editingId && <button type="button" className="btn btn-secondary" onClick={cancelEdit}>ביטול</button>}
            </div>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <StickyNote size={48} className="text-tertiary mb-4"/>
          <h3 className="text-h3 mb-2">אין הערות עדיין</h3>
          <p className="text-secondary mb-4">רשום רעיונות, החלטות ומעקב כאן.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> הערה ראשונה</button>
        </div>
      ) : (
        <div className="notes-grid">
          {filtered.map(note => (
            <div key={note.id} className="note-card glass-panel">
              <div className="note-card-header">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
                  <div className={`icon-badge-rounded i-bg-purple`} style={{ width: '30px', height: '30px' }}>
                    <StickyNote size={15} />
                  </div>
                  <span className="badge badge-purple">{note.tag}</span>
                  {selectedProductIds.length > 1 && (
                    <span className="text-[10px] font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                      {data.products.find(p => p.id === note.product_id)?.name}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="btn-icon" title="עריכה" onClick={() => startEdit(note)}><Pencil size={14}/></button>
                  <button className="btn-icon text-danger" title="מחיקה" onClick={() => { if(window.confirm('למחוק הערה זו?')) deleteNote(note.id); }}><Trash2 size={15}/></button>
                </div>
              </div>
              <h4 className="note-title font-medium mt-2 mb-1">{note.title}</h4>
              {note.content && <p className="text-sm text-secondary leading-relaxed">{note.content}</p>}
              <p className="text-xs text-tertiary mt-3" style={{ borderTop:'1px solid var(--border-color)', paddingTop:'0.5rem' }}>
                {new Date(note.created_at || note.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
