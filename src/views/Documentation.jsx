import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProductContext } from '../context/ProductContext';
import { 
  BookOpen, FileText, Database, Plus, Search, X, Check, 
  Folder, FolderOpen, ExternalLink, Link, File, Upload,
  MoreVertical, Trash2, Edit3, Globe
} from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Documentation.css';

const DOC_TYPES = [
  { id: 'Doc', label: 'מסמך', icon: <FileText size={18}/> },
  { id: 'Dictionary', label: 'מילון', icon: <Database size={18}/> },
  { id: 'Link', label: 'קישור Drive', icon: <Globe size={18}/> },
  { id: 'File', label: 'קובץ מקומי', icon: <File size={18}/> },
];

const CategoryFolder = ({ name, docs, selectedDocId, onSelect, expanded, onToggle }) => {
  return (
    <div className="folder-item">
      <div className="folder-header" onClick={onToggle}>
        {expanded ? <FolderOpen size={16} className="text-yellow-400"/> : <Folder size={16} className="text-yellow-500"/>}
        <span>{name}</span>
        <span className="text-[10px] bg-white/5 px-1.5 rounded-full mr-auto">{docs.length}</span>
      </div>
      {expanded && (
        <div className="folder-content animate-fade-in">
          {docs.map(doc => (
            <button 
              key={doc.id} 
              className={`doc-list-item ${selectedDocId===doc.id?'active':''}`} 
              onClick={() => onSelect(doc.id)}
            >
              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', width: '100%' }}>
                {doc.type === 'Link' ? <Link size={13}/> : doc.type === 'File' ? <File size={13}/> : doc.type === 'Dictionary' ? <Database size={13}/> : <FileText size={13}/>}
                <span className="truncate text-xs">{doc.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Documentation = () => {
  const { activeDocs, activeProduct, data, addDoc, updateDoc, deleteDoc, selectedProductIds } = useProductContext();
  const [selectedDocId, setSelectedDocId] = useState(activeDocs.length > 0 ? activeDocs[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(['General']);
  const [fileToUpload, setFileToUpload] = useState(null);
  
  const [form, setForm] = useState({ 
    title:'', 
    type:'Doc', 
    content:'', 
    category:'General',
    url: '',
    file_name: '',
    file_type: ''
  });

  if (!activeProduct) return null;

  // Group by category
  const docsByCategory = activeDocs.reduce((acc, doc) => {
    const cat = doc.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    if (doc.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      acc[cat].push(doc);
    }
    return acc;
  }, {});

  const categories = Object.keys(docsByCategory).sort();
  const selectedDoc = activeDocs.find(d => d.id === selectedDocId);

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    setIsSaving(true);
    try {
      let currentForm = { ...form };

      // Handle real file upload if needed
      if (form.type === 'File' && fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${activeProduct.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documentation')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;
        currentForm.url = filePath;
      }

      let res;
      if (editingId) {
        res = await updateDoc(editingId, currentForm);
      } else {
        res = await addDoc({ ...currentForm, product_id: activeProduct.id });
      }

      if (res.success) {
        setForm({ title:'', type:'Doc', content:'', category:'General', url:'', file_name:'', file_type:'' });
        setFileToUpload(null);
        setShowAddForm(false);
        setEditingId(null);
        if (res.data) setSelectedDocId(res.data.id);
      } else {
        alert('שגיאה בשמירת התיעוד: ' + res.error);
      }
    } catch (err) {
      alert('שגיאה לא צפויה: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = () => {
    if (!selectedDoc) return;
    setForm({ 
      title: selectedDoc.title, 
      type: selectedDoc.type, 
      content: selectedDoc.content || '', 
      category: selectedDoc.category || 'General',
      url: selectedDoc.url || '',
      file_name: selectedDoc.file_name || '',
      file_type: selectedDoc.file_type || ''
    });
    setEditingId(selectedDoc.id);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setForm({ title:'', type:'Doc', content:'', category:'General', url:'', file_name:'', file_type:'' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleToggleFolder = (cat) => {
    if (expandedFolders.includes(cat)) {
      setExpandedFolders(expandedFolders.filter(f => f !== cat));
    } else {
      setExpandedFolders([...expandedFolders, cat]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      setForm({ ...form, file_name: file.name, file_type: file.type });
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.url) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('documentation')
        .download(doc.url);

      if (error) throw error;

      // Create a link and trigger browser download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('שגיאה בהורדת הקובץ מאחסון הענן');
    }
  };

  const inputStyle = { width:'100%', border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', padding:'0.6rem 0.8rem', borderRadius:'var(--border-radius-sm)', fontFamily:'var(--font-family)', direction:'rtl' };

  return (
    <div className="content-area animate-fade-in docs-layout-outer">
      <header className="page-header sticky top-0 bg-inherit z-10 pb-2">
        <div>
          <h1 className="text-h1 mb-1">מרכז ידע ותיעוד</h1>
          <p className="text-secondary text-sm">ניהול מסמכים, מפרטים וקישורים חיצוניים</p>
        </div>
      </header>

      <MultiProductSelector />
      
      <div className="docs-layout">
        <div className="docs-sidebar glass-panel">
          <div className="docs-sidebar-header">
            <h3 className="text-h3 font-semibold">תיקיות</h3>
            <button className="btn-icon" title="מסמך חדש" onClick={() => { cancelEdit(); setShowAddForm(true); setSelectedDocId(null); }}><Plus size={18}/></button>
          </div>
          <div className="search-bar-small">
            <Search size={14} className="text-tertiary"/>
            <input type="text" placeholder="חיפוש במסמכים..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ direction:'rtl' }}/>
          </div>
          <div className="docs-list mt-2">
            {categories.map(cat => (
              <CategoryFolder 
                key={cat} 
                name={cat} 
                docs={docsByCategory[cat]} 
                selectedDocId={selectedDocId}
                onSelect={(id) => { setSelectedDocId(id); setShowAddForm(false); setEditingId(null); }}
                expanded={expandedFolders.includes(cat)}
                onToggle={() => handleToggleFolder(cat)}
              />
            ))}
          </div>
        </div>

        <div className="docs-content glass-panel">
          {showAddForm ? (
            <form onSubmit={handleAddDoc} className="doc-add-form animate-fade-in">
              <div className="flex-between mb-6">
                <div className="flex-center gap-3">
                  <h2 className="text-h2">{editingId ? 'עריכת פריט תיעוד' : 'יצירת פריט תיעוד'}</h2>
                  <span className="badge badge-indigo">{activeProduct.name}</span>
                </div>
                <button type="button" className="btn-icon" onClick={cancelEdit}><X size={18}/></button>
              </div>

              <div className="type-selector">
                {DOC_TYPES.map(t => (
                  <div 
                    key={t.id} 
                    className={`type-option ${form.type === t.id ? 'active' : ''}`}
                    onClick={() => setForm({...form, type: t.id})}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}><label className="text-sm text-secondary block mb-1">כותרת התיעוד *</label><input required autoFocus type="text" style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="לדוגמה: אפיון דרישות למערכת הניהול"/></div>
                <div><label className="text-sm text-secondary block mb-1">תיקייה / קטגוריה</label>
                  <input list="categories" style={inputStyle} value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="בחר או הקלד שם חדש..."/>
                  <datalist id="categories">
                    {categories.map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
                
                {form.type === 'Link' ? (
                  <div style={{ gridColumn: '1 / -1' }}><label className="text-sm text-secondary block mb-1">קישור Google Drive (או URL אחר)</label>
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <Globe size={18} style={{ position:'absolute', right:'12px', color:'var(--text-tertiary)' }}/>
                      <input required type="url" style={{...inputStyle, paddingRight:'2.5rem'}} value={form.url} onChange={e => setForm({...form,url:e.target.value})} placeholder="https://drive.google.com/..."/>
                    </div>
                  </div>
                ) : form.type === 'File' ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="text-sm text-secondary block mb-1">צירוף קובץ</label>
                    <div className="file-upload-zone" onClick={() => document.getElementById('real-upload').click()}>
                      <Upload size={32} className="text-tertiary mb-2 mx-auto"/>
                      <p className="text-sm text-secondary">{form.file_name ? `קובץ נבחר: ${form.file_name}` : 'לחץ להעלאת קובץ מהמחשב'}</p>
                      <input id="real-upload" type="file" style={{display:'none'}} onChange={handleFileSelect}/>
                    </div>
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}><label className="text-sm text-secondary block mb-1">תוכן המסמך</label><textarea rows={8} style={{...inputStyle, resize:'vertical'}} value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="כתוב כאן את גוף המסמך ב-Markdown או טקסט חופשי..."/></div>
                )}
              </div>
              <div className="mt-8 flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <Check size={16}/> {isSaving ? 'שומר...' : 'שמירת תיעוד'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>ביטול</button>
              </div>
            </form>
          ) : selectedDoc ? (
            <div className="doc-viewer animate-fade-in">
              <header className="doc-header mb-8 pb-6">
                <div className="flex-between mb-4">
                  <div className="flex-center gap-2" style={{ justifyContent:'flex-start' }}>
                    <div className="icon-badge-sm i-bg-yellow">
                      {selectedDoc.type === 'Link' ? <Globe size={16}/> : selectedDoc.type === 'File' ? <File size={16}/> : <FileText size={16}/>}
                    </div>
                    <span className="badge badge-indigo">{selectedDoc.category}</span>
                    <span className="text-xs text-tertiary">עודכן ב-{selectedDoc.updated_at}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-icon" title="עריכה" onClick={startEdit}><Edit3 size={16}/></button>
                    <button className="btn-icon text-danger" title="מחיקה" onClick={() => { if(window.confirm('למחוק מסמך זה?')){ deleteDoc(selectedDoc.id); setSelectedDocId(null); } }}><Trash2 size={16}/></button>
                  </div>
                </div>
                <h1 className="text-h1 mb-2">{selectedDoc.title}</h1>
                <div className="flex items-center gap-2 text-tertiary text-sm">
                  <BookOpen size={14}/>
                  <span>{selectedDoc.type === 'Link' ? 'קישור חיצוני' : selectedDoc.type === 'File' ? 'קובץ מקומי' : 'מסמך מקומי'}</span>
                  {selectedProductIds.length > 1 && selectedDoc.product_id && (
                     <>
                       <span>•</span>
                       <span className="badge badge-gray">{data.products.find(p => p.id === selectedDoc.product_id)?.name}</span>
                     </>
                  )}
                </div>
              </header>

              <div className="doc-body">
                {selectedDoc.type === 'Link' ? (
                  <div className="link-viewer glass-panel p-8 text-center animate-slide-up">
                    <Globe size={48} className="text-blue-500 mb-4 mx-auto"/>
                    <h3 className="text-h3 mb-2">קישור חיצוני זמין</h3>
                    <p className="text-secondary mb-6">מסמך זה מאוחסן במיקום חיצוני (Google Drive או דומה).</p>
                    <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex gap-2">
                       מעבר למסמך <ExternalLink size={16}/>
                    </a>
                    <div className="mt-4 p-2 bg-white/5 rounded text-xs break-all font-mono text-tertiary">
                      {selectedDoc.url}
                    </div>
                  </div>
                ) : selectedDoc.type === 'File' ? (
                  <div className="file-viewer glass-panel p-8 text-center animate-slide-up">
                    <File size={48} className="text-yellow-500 mb-4 mx-auto"/>
                    <h3 className="text-h3 mb-2">{selectedDoc.file_name || 'קובץ ללא שם'}</h3>
                    <p className="text-secondary mb-4">סוג קובץ: {selectedDoc.file_type || 'לא ידוע'}</p>
                    <button className="btn btn-secondary inline-flex gap-2" onClick={() => handleDownload(selectedDoc)}>
                       הורדת קובץ <Upload size={16} className="rotate-180"/>
                    </button>
                  </div>
                ) : (
                  <div className="prose text-secondary leading-relaxed">
                    {selectedDoc.content ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{selectedDoc.content}</div>
                    ) : (
                      <div className="p-8 text-center bg-white/5 rounded-lg border border-dashed border-white/10">
                        <FileText size={32} className="text-tertiary mb-3 mx-auto"/>
                        <p>אין תוכן להצגה במסמך זה.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state text-center py-20">
              <div className="icon-badge-xl i-bg-yellow mb-6 mx-auto" style={{ width: '80px', height: '80px' }}>
                <BookOpen size={40} className="text-yellow-500"/>
              </div>
              <h3 className="text-h2 mb-4">בחירת פריט תיעוד</h3>
              <p className="text-secondary text-lg mb-8 max-w-md mx-auto">כאן תוכל לנהל את כל הידע של המוצר שלך - מפרטים, מילוני נתונים, מדריכים וקישורים למסמכים ב-Google Drive.</p>
              <button className="btn btn-primary btn-lg" onClick={() => setShowAddForm(true)}>
                <Plus size={20}/> התחלת תיעוד חדש
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
