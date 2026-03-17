import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Bell, Search, User, Plus, X, Check, Sun, Moon, Trash2, LogOut, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SharingModal from './SharingModal';
import './Header.css';

const Header = () => {
  const { data, setActiveProduct, addProduct, deleteProduct, darkMode, toggleDarkMode, searchTerm, setSearchTerm } = useProductContext();
  const { logout, userProfile, isHoD } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newId = `prod_${Date.now()}`;
    addProduct({ id: newId, name: form.name, description: form.description });
    setActiveProduct(newId);
    setForm({ name: '', description: '' });
    setShowAddProduct(false);
  };

  const inputStyle = {
    width: '100%', border: '1.5px solid var(--border-color)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    padding: '0.6rem 0.85rem', borderRadius: 'var(--border-radius-sm)',
    fontFamily: 'var(--font-family)', fontSize: '0.9rem', direction: 'rtl',
  };

  return (
    <>
      <header className="header glass-panel">
        <div className="header-left">
          {isHoD && location.pathname !== '/department' && (
            <button 
              className="btn btn-secondary flex-center gap-1" 
              style={{ marginLeft: '1rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => navigate('/department')}
            >
              <ArrowRight size={15} /> חזרה למחלקתי
            </button>
          )}
          <div className="product-selector flex-center gap-2">
            <select value={data.activeProductId} onChange={e => setActiveProduct(e.target.value)} className="product-select text-h3 font-semibold">
              {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {data.products.length > 0 && (
              <div className="flex-center gap-1">
                <button 
                  className="btn-icon-xs text-primary hover:bg-primary/10" 
                  title="שיתוף מוצר"
                  onClick={() => setShowSharingModal(true)}
                >
                  <Users size={16} />
                </button>
                <button 
                  className="btn-icon-xs text-danger hover:bg-danger/10" 
                  title="מחיקת מוצר"
                  onClick={() => {
                    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${data.products.find(p => p.id === data.activeProductId)?.name}"? פעולה זו תמחק את כל הנתונים הקשורים.`)) {
                      deleteProduct(data.activeProductId);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowAddProduct(true)}>
            <Plus size={15} /> מוצר חדש
          </button>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="חיפוש מוצרים או פיצ'רים..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="search-icon"><Search size={16} /></div>
          </div>
          <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? 'מצב יום' : 'מצב לילה'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="user-profile-actions flex-center gap-3">
            <div className="user-info flex-col items-start hidden-md">
              <span className="text-xs font-bold">{userProfile?.name}</span>
              <span className="text-[10px] text-tertiary">{userProfile?.role}</span>
            </div>
            <button className="btn-icon text-tertiary hover:text-danger" onClick={logout} title="התנתקות">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {showAddProduct && (
        <div className="strategy-modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="strategy-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="text-h3">הוספת מוצר חדש</h3>
              <button className="btn-icon" onClick={() => setShowAddProduct(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label className="text-sm text-secondary block mb-1">שם המוצר</label>
                <input autoFocus required type="text" style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="לדוגמה: פלטפורמת אנליטיקה" />
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">תיאור</label>
                <textarea rows={3} style={{...inputStyle, resize:'vertical'}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="תיאור קצר של המוצר..." />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-start', gap:'0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProduct(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> יצירה</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSharingModal && (
        <SharingModal 
          productId={data.activeProductId}
          productName={data.products.find(p => p.id === data.activeProductId)?.name}
          onClose={() => setShowSharingModal(false)}
        />
      )}
    </>
  );
};

export default Header;
