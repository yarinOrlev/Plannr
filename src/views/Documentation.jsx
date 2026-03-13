import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { BookOpen, FileText, Database, Plus, Search, X, Check } from 'lucide-react';
import './Documentation.css';

const Documentation = () => {
  const { activeDocs, activeProduct, addDoc } = useProductContext();
  const [selectedDocId, setSelectedDocId] = useState(activeDocs.length > 0 ? activeDocs[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title:'', type:'Dictionary', content:'' });

  if (!activeProduct) return null;

  const filteredDocs = activeDocs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedDoc = activeDocs.find(d => d.id === selectedDocId);

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addDoc({ title:form.title, type:form.type, content:form.content });
    setForm({ title:'', type:'Dictionary', content:'' });
    setShowAddForm(false);
  };

  const mockSchema = [
    { name:'user_id', type:'UUID', description:'מזהה ייחודי של המשתמש.' },
    { name:'event_name', type:'String', description:'שם האירוע שנרשם.' },
    { name:'timestamp', type:'Timestamp', description:'חותמת זמן UTC.' },
    { name:'properties', type:'JSON', description:'מטאדאטה נוסף של האירוע.' },
  ];

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in docs-layout">
      <div className="docs-sidebar glass-panel">
        <div className="docs-sidebar-header">
          <h3 className="text-h3 font-semibold">מסמכים</h3>
          <button className="btn-icon" title="הוספת מסמך" onClick={() => setShowAddForm(!showAddForm)}><Plus size={18}/></button>
        </div>
        <div className="search-bar-small">
          <Search size={14} className="text-tertiary"/>
          <input type="text" placeholder="סינון..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ direction:'rtl' }}/>
        </div>
        <div className="docs-list mt-4">
          {filteredDocs.map(doc => (
            <button key={doc.id} className={`doc-list-item ${selectedDocId===doc.id?'active':''}`} onClick={() => { setSelectedDocId(doc.id); setShowAddForm(false); }}>
              <div className="icon-badge-sm i-bg-yellow" style={{ width: '24px', height: '24px' }}>
                {doc.type==='Dictionary'?<Database size={14}/>:<FileText size={14}/>}
              </div>
              <span className="doc-item-title text-sm">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="docs-content glass-panel">
        {showAddForm ? (
          <form onSubmit={handleAddDoc} className="doc-add-form animate-fade-in">
            <div className="flex-between mb-6"><h2 className="text-h2">מסמך חדש</h2><button type="button" className="btn-icon" onClick={() => setShowAddForm(false)}><X size={18}/></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div><label className="text-sm text-secondary block mb-1">כותרת</label><input required autoFocus type="text" style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="לדוגמה: מילון אירועים"/></div>
              <div><label className="text-sm text-secondary block mb-1">סוג מסמך</label>
                <select style={inputStyle} value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                  <option value="Dictionary">מילון</option>
                  <option value="Spec">מפרט</option>
                  <option value="Guide">מדריך</option>
                  <option value="Other">אחר</option>
                </select>
              </div>
              <div><label className="text-sm text-secondary block mb-1">תוכן</label><textarea rows={5} style={{...inputStyle, resize:'vertical'}} value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="תיאור ותוכן ראשוני..."/></div>
              <div style={{ display:'flex', justifyContent:'flex-start' }}><button type="submit" className="btn btn-primary"><Check size={16}/> שמירה</button></div>
            </div>
          </form>
        ) : selectedDoc ? (
          <div className="doc-viewer animate-fade-in">
            <header className="doc-header mb-6">
              <div className="flex-center gap-2 mb-2" style={{ justifyContent:'flex-start' }}>
                <span className="badge badge-purple">{selectedDoc.type}</span>
                <span className="text-xs text-tertiary">עודכן {selectedDoc.updatedAt}</span>
              </div>
              <h1 className="text-h1">{selectedDoc.title}</h1>
            </header>
            <div className="doc-body text-secondary">
              {selectedDoc.content ? <p className="text-lg">{selectedDoc.content}</p> : (
                <>
                  <p className="mb-6 text-lg">מילון זה מגדיר את סכמת האירועים הבסיסית עבור <strong className="text-primary">{activeProduct.name}</strong>.</p>
                  <h3 className="text-h3 mb-4 text-primary">הגדרת סכמה</h3>
                  <div className="table-container">
                    <table className="schema-table">
                      <thead><tr><th>שם שדה</th><th>סוג נתון</th><th>תיאור</th></tr></thead>
                      <tbody>{mockSchema.map((row,i) => (<tr key={i}><td className="font-medium text-primary font-mono">{row.name}</td><td><span className="badge badge-blue">{row.type}</span></td><td>{row.description}</td></tr>))}</tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} className="text-tertiary mb-4"/>
            <h3 className="text-h3 mb-2">אין מסמך נבחר</h3>
            <p className="text-secondary mb-4">בחר מסמך מהסרגל הצדדי או צור חדש.</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={16}/> מסמך חדש</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentation;
