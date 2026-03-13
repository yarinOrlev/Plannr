import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MessageSquare, CheckCircle, Clock, Plus, ChevronRight, LayoutDashboard, Map, List, ChevronDown, ChevronUp } from 'lucide-react';
import './DepartmentOverview.css';

const DepartmentOverview = () => {
  const { data, addReview, updateReviewStatus, setActiveProduct } = useProductContext();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandingProductItems, setExpandingProductItems] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNote, setNewNote] = useState('');

  const products = data.products || [];
  const allReviews = data.reviews || [];

  const getProductRoadmapSummary = (productId) => {
    const roadmap = data.roadmaps.filter(rm => rm.productId === productId);
    const boards = data.roadmapBoards.filter(b => b.productId === productId);
    const activeBoard = boards[0] || { name: 'Main' };
    
    return {
      itemCount: roadmap.length,
      boardName: activeBoard.name,
      viewType: activeBoard.viewType || 'kanban',
      items: roadmap
    };
  };

  const handleAddNote = (productId, itemId = null) => {
    if (!newNote.trim()) return;
    addReview(productId, newNote, itemId);
    setNewNote('');
    setSelectedProduct(null);
    setSelectedItem(null);
  };

  const handleSeeProduct = (productId) => {
    setActiveProduct(productId);
    navigate('/roadmaps');
  };

  return (
    <div className="content-area animate-fade-in department-overview">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">מבט מחלקתי</h1>
          <p className="text-secondary text-lg">סקירת כלל המוצרים, מפות הדרכים ומשוב מנהלים</p>
        </div>
      </header>

      <div className="stats-grid mb-6">
        <div className="stat-card glass-panel">
          <div className="flex-between">
            <div>
              <p className="text-sm text-secondary">סה"כ מוצרים</p>
              <h2 className="text-h2">{products.length}</h2>
            </div>
            <div className="icon-badge bg-blue"><Briefcase size={20} /></div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="flex-between">
            <div>
              <p className="text-sm text-secondary">ביקורות פתוחות</p>
              <h2 className="text-h2">{allReviews.filter(r => r.status === 'Pending').length}</h2>
            </div>
            <div className="icon-badge bg-yellow"><Clock size={20} /></div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="flex-between">
            <div>
              <p className="text-sm text-secondary">ביקורות שטופלו</p>
              <h2 className="text-h2">{allReviews.filter(r => r.status === 'Resolved').length}</h2>
            </div>
            <div className="icon-badge bg-green"><CheckCircle size={20} /></div>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {products.map(product => {
          const summary = getProductRoadmapSummary(product.id);
          const productReviews = allReviews.filter(r => r.productId === product.id);
          const pendingCount = productReviews.filter(r => r.status === 'Pending').length;

          return (
            <div key={product.id} className="product-overview-card glass-panel">
              <div className="card-header flex-between mb-4">
                <div className="flex-center gap-3">
                  <div className="icon-badge bg-indigo"><LayoutDashboard size={18} /></div>
                  <div>
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    <p className="text-xs text-tertiary">מזהה: {product.id}</p>
                  </div>
                </div>
                {pendingCount > 0 && <span className="badge badge-yellow">סקירה דרושה ({pendingCount})</span>}
              </div>

              <div className="card-body mb-6">
                <div className="roadmap-summary p-3 bg-secondary rounded-lg mb-4">
                  <div className="flex-between text-sm mb-2">
                    <span className="text-secondary">מפת דרכים פעילה:</span>
                    <span className="font-medium">{summary.boardName}</span>
                  </div>
                  <div className="flex-between text-sm">
                    <span className="text-secondary">פריטים במפה:</span>
                    <span className="font-medium">{summary.itemCount}</span>
                  </div>
                </div>

                <div className="review-section">
                  <h4 className="text-sm font-semibold mb-2 flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <MessageSquare size={14} /> הערות מנהל
                  </h4>
                  <div className="review-list">
                    {productReviews.length > 0 ? (
                      productReviews.slice(0, 2).map(rev => (
                        <div key={rev.id} className={`review-item ${rev.status === 'Resolved' ? 'resolved' : ''}`}>
                          <p className="text-xs">{rev.content}</p>
                          <span className="text-[10px] text-tertiary">{new Date(rev.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-tertiary">אין הערות עדיין.</p>
                    )}
                    {productReviews.length > 2 && <p className="text-[10px] text-center mt-1 text-secondary">+ עוד {productReviews.length - 2} הערות</p>}
                  </div>
                </div>
              </div>

              <div className="card-footer pt-4 border-t border-color flex-between">
                <div className="flex-center gap-2">
                  <button className="btn btn-secondary text-xs py-1" onClick={() => setSelectedProduct(product.id)}>
                    <Plus size={14} /> הערה כללית
                  </button>
                  <button className="btn btn-icon-sm" onClick={() => setExpandingProductItems(expandingProductItems === product.id ? null : product.id)}>
                    {expandingProductItems === product.id ? <ChevronUp size={16}/> : <List size={16}/>}
                  </button>
                </div>
                <div 
                  className="text-indigo flex-center gap-1 text-xs font-semibold cursor-pointer"
                  onClick={() => handleSeeProduct(product.id)}
                >
                  לצפייה במוצר <ChevronRight size={14} />
                </div>
              </div>

              {expandingProductItems === product.id && (
                <div className="product-items-list mt-4 p-3 bg-secondary rounded-lg animate-fade-in">
                  <h4 className="text-xs font-bold mb-3 border-b border-color pb-1">פריטים במפת דרכים</h4>
                  <div className="flex-col gap-2">
                    {summary.items.map(item => {
                      const itemReviews = allReviews.filter(r => r.itemId === item.id);
                      return (
                        <div key={item.id} className="item-row flex-between p-2 hover-bg-tertiary rounded">
                          <div>
                            <p className="text-xs font-medium">{item.title}</p>
                            {itemReviews.length > 0 && <span className="text-[10px] text-yellow">{itemReviews.length} הערות פתוחות</span>}
                          </div>
                          <button className="btn-icon-xs text-tertiary" onClick={() => setSelectedItem(item.id)}>
                            <MessageSquare size={12} />
                          </button>

                          {selectedItem === item.id && (
                            <div className="item-note-popup glass-panel p-3 animate-scale-in">
                              <p className="text-[10px] mb-2 font-bold">הערה ל: {item.title}</p>
                              <textarea 
                                className="modal-input w-full p-2 h-16 text-xs" 
                                placeholder="כתוב הערה ספציפית..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                              />
                              <div className="flex-center gap-2 mt-2">
                                <button className="btn btn-primary text-[10px] px-2" onClick={() => handleAddNote(product.id, item.id)}>שמירה</button>
                                <button className="btn btn-secondary text-[10px] px-2" onClick={() => setSelectedItem(null)}>ביטול</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProduct === product.id && (
                <div className="note-popup glass-panel p-4 mt-4 animate-scale-in">
                  <textarea 
                    className="modal-input w-full p-2 h-20 text-sm" 
                    placeholder="כתוב כאן את הערת המנהל..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex-center gap-2 mt-2" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn btn-primary text-xs" onClick={() => handleAddNote(product.id)}>שמירה</button>
                    <button className="btn btn-secondary text-xs" onClick={() => setSelectedProduct(null)}>ביטול</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="recent-reviews-section glass-panel mt-8 p-6">
        <h3 className="text-h3 mb-4">כלל הביקורות האחרונות</h3>
        <table className="prioritization-table w-full">
          <thead>
            <tr>
              <th className="text-right">מוצר</th>
              <th className="text-right">תוכן ההערה</th>
              <th>תאריך</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(rev => (
              <tr key={rev.id}>
                <td className="font-medium">{products.find(p => p.id === rev.productId)?.name || 'לא ידוע'}</td>
                <td><p className="text-sm max-w-md line-clamp-1">{rev.content}</p></td>
                <td className="text-center">{new Date(rev.createdAt).toLocaleDateString('he-IL')}</td>
                <td className="text-center">
                  <span className={`badge ${rev.status === 'Resolved' ? 'badge-green' : 'badge-yellow'}`}>
                    {rev.status === 'Resolved' ? 'טופל' : 'ממתין'}
                  </span>
                </td>
                <td className="text-center">
                  <button 
                    className="btn btn-secondary text-[10px] py-1 px-2"
                    onClick={() => updateReviewStatus(rev.id, rev.status === 'Resolved' ? 'Pending' : 'Resolved')}
                  >
                    {rev.status === 'Resolved' ? 'פתח מחדש' : 'סמן כטופל'}
                  </button>
                </td>
              </tr>
            ))}
            {allReviews.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-secondary">אין ביקורות להצגה</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentOverview;
