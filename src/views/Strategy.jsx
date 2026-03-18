import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Compass, Users, Lightbulb, AlertTriangle, Pencil, X, Check, Trash2, Plus, Calendar, SlidersHorizontal } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Strategy.css';

const StrategyCard = ({ item, colorClass, icon, onEdit }) => (
  <div className="strategy-card glass-panel">
    <div className="strategy-card-header">
      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
        <div className={`icon-badge ${colorClass}`}>{icon}</div>
        <h3 className="text-h3">{item.typeLabel || item.type}</h3>
      </div>
      <button className="btn-icon" onClick={() => onEdit(item)} title="עריכה">
        <Pencil size={15} />
      </button>
    </div>
    <div className="strategy-card-body mt-4">
      <h4 className="text-lg font-medium mb-2">{item.title}</h4>
      <p className="text-secondary">{item.description}</p>
    </div>
  </div>
);

const TYPE_LABELS = { Problem: 'בעיה', People: 'קהל יעד', Product: 'הפתרון', Vision: 'חזון' };

const Strategy = () => {
  const { 
    activeProduct, 
    selectedProductIds,
    updateStrategy, 
    data, 
    addAvailableTeam, 
    removeAvailableTeam,
    roadmapBoards,
    addRoadmapBoard,
    deleteRoadmapBoard
  } = useProductContext();
  
  const [activeTab, setActiveTab] = useState(selectedProductIds[0] || 'settings');
  const [editItem, setEditItem] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState('kanban');
  const [newBoardQuarter, setNewBoardQuarter] = useState('Q3');
  const [newBoardYear, setNewBoardYear] = useState('2026');

  // Handle tab switching when selection changes
  React.useEffect(() => {
    if (activeTab !== 'settings' && !selectedProductIds.includes(activeTab)) {
      setActiveTab(selectedProductIds[0] || 'settings');
    }
  }, [selectedProductIds]);

  if (!activeProduct) return null;

  const handleSave = () => {
    if (!editItem?.title?.trim() && editItem?.type !== 'Vision') return;
    updateStrategy(editItem.type, editItem.title || '', editItem.description, editItem.product_id);
    setEditItem(null);
  };

  const handleEdit = (item, productId) => {
    setEditItem({ ...item, product_id: productId });
  };

  const handleEditVision = (vision, productId) => {
    setEditItem({
      type: 'Vision',
      title: 'חזון המוצר',
      description: vision?.description || '',
      product_id: productId
    });
  };

  return (
    <div className="content-area animate-fade-in strategy-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">אסטרטגיית מוצר</h1>
          <p className="text-secondary text-lg">הגדרת חזון, קהל יעד ותכנון אסטרטגי</p>
        </div>
      </header>

      <MultiProductSelector />

      {/* Internal Tabs Navigation */}
      <div className="strategy-tabs-nav mb-8">
        {selectedProductIds.map(pid => {
          const product = data.products.find(p => p.id === pid);
          if (!product) return null;
          return (
            <button 
              key={pid}
              className={`strategy-tab-item ${activeTab === pid ? 'active' : ''}`}
              onClick={() => setActiveTab(pid)}
            >
              <Compass size={16} />
              {product.name}
              {pid === activeProduct.id && <span className="tab-primary-dot"></span>}
            </button>
          );
        })}
      </div>

      {editItem && (
        <div className="strategy-modal-overlay premium-blur" onClick={() => setEditItem(null)}>
          <div className="strategy-modal premium-modal glass-panel animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium mb-8">
              <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                <div className="icon-badge-sm bg-accent-primary"><Pencil size={20} /></div>
                <h3 className="text-h2">עריכת {TYPE_LABELS[editItem.type]}</h3>
              </div>
              <button className="close-btn-premium" onClick={() => setEditItem(null)}><X size={24} /></button>
            </div>

            <div className="modal-body-premium">
              {editItem.type !== 'Vision' && (
                <div className="input-group-premium">
                  <label className="input-label-premium">כותרת הפריט</label>
                  <input 
                    autoFocus 
                    type="text" 
                    className="premium-input" 
                    value={editItem.title}
                    onChange={e => setEditItem({...editItem, title: e.target.value})} 
                    placeholder="הזן כותרת קצרה וממוקדת..." 
                  />
                </div>
              )}
              <div className="input-group-premium">
                <label className="input-label-premium">
                  {editItem.type === 'Vision' ? 'חזון המוצר המלא' : 'תיאור מפורט'}
                </label>
                <textarea 
                  autoFocus={editItem.type === 'Vision'} 
                  className="premium-input premium-textarea" 
                  rows={editItem.type === 'Vision' ? 8 : 4} 
                  value={editItem.description}
                  onChange={e => setEditItem({...editItem, description: e.target.value})} 
                  placeholder={editItem.type === 'Vision' ? "כתוב כאן את חזון המוצר בצורה מעוררת השראה..." : "פרט כאן את המהות..."} 
                />
              </div>
            </div>

            <div className="modal-footer-premium mt-10">
              <button className="btn btn-secondary btn-lg" onClick={() => setEditItem(null)}>ביטול</button>
              <button className="btn btn-primary btn-lg px-8" onClick={handleSave}>
                <Check size={20} /> שמירת שינויים
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="strategy-tab-content">
        {activeTab !== 'settings' ? (
          (() => {
            const product = data.products.find(p => p.id === activeTab);
            if (!product) return null;
            const productStrategy = data.strategy.filter(s => s.product_id === activeTab);
            const getStrategyItem = (type) => {
              const found = productStrategy.find(s => s.type === type);
              return found
                ? { ...found, typeLabel: TYPE_LABELS[type] }
                : { type, typeLabel: TYPE_LABELS[type], title: 'לא הוגדר', description: 'לחץ על עריכה כדי להוסיף.' };
            };

            const problem = getStrategyItem('Problem');
            const people  = getStrategyItem('People');
            const solution = getStrategyItem('Product');
            const vision  = productStrategy.find(s => s.type === 'Vision');

            return (
              <div key={activeTab} className="product-strategy-section animate-scale-in">
                <div className="strategy-grid mb-8">
                  <StrategyCard item={problem} icon={<AlertTriangle size={24}/>} colorClass="bg-red"   onEdit={(item) => handleEdit(item, activeTab)}/>
                  <StrategyCard item={people}  icon={<Users size={24}/>}         colorClass="bg-blue"  onEdit={(item) => handleEdit(item, activeTab)}/>
                  <StrategyCard item={solution} icon={<Lightbulb size={24}/>}     colorClass="bg-green" onEdit={(item) => handleEdit(item, activeTab)}/>
                </div>

                <div className="vision-section glass-panel">
                  <div className="vision-header-container">
                    <div className="vision-header">
                      <Compass size={26} />
                      <h2 className="text-h2">חזון המוצר</h2>
                    </div>
                    <button className="btn-icon" onClick={() => handleEditVision(vision, activeTab)} title="עריכת חזון">
                      <Pencil size={18} />
                    </button>
                  </div>
                  <p className="vision-text text-lg text-secondary leading-relaxed">
                    {vision?.description ? (
                      vision.description
                    ) : (
                      <>
                        עבור <strong className="text-primary">{people.title}</strong> הנאבקים עם{' '}
                        <strong className="text-primary">{problem.title}</strong>,{' '}
                        <strong className="text-primary">{product.name}</strong> מספק{' '}
                        <em>{solution.description}</em>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="global-settings-tab animate-scale-in">
            <div className="teams-management-section glass-panel">
              <div className="section-header mb-4">
                <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                  <div className="icon-badge bg-purple"><Users size={20} /></div>
                  <h3 className="text-h3">צוותי עבודה</h3>
                </div>
                <div className="team-add-input-wrapper">
                  <input
                    type="text"
                    className="modal-input"
                    style={{ width: '200px', height: '36px' }}
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="שם צוות חדש..."
                  />
                  <button className="btn btn-primary" style={{ padding: '0 1rem', height: '36px' }} onClick={() => { addAvailableTeam(newTeamName); setNewTeamName(''); }}>
                    <Plus size={16} /> הוספה
                  </button>
                </div>
              </div>
              <div className="teams-list-grid">
                {(data.availableTeams || []).map(team => (
                  <div key={team} className="team-management-item">
                    <span className="text-sm font-medium">{team}</span>
                    <button className="text-danger" onClick={() => removeAvailableTeam(team)} title="הסרה">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="roadmap-management-section glass-panel mt-6">
              <div className="section-header mb-4">
                <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                  <div className="icon-badge bg-blue"><Calendar size={20} /></div>
                  <h3 className="text-h3">לוחות מפת דרכים</h3>
                </div>
                <div className="team-add-input-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="modal-input"
                      style={{ width: '200px', height: '36px' }}
                      value={newBoardName}
                      onChange={e => setNewBoardName(e.target.value)}
                      placeholder="שם לוח חדש..."
                    />
                    <select 
                      className="modal-input" 
                      style={{ width: '150px', height: '36px', padding: '0 0.5rem' }}
                      value={newBoardType}
                      onChange={e => setNewBoardType(e.target.value)}
                    >
                      <option value="kanban">התקדמות (Kanban)</option>
                      <option value="timeline">ציר זמן (Timeline)</option>
                    </select>
                    {newBoardType === 'timeline' && (
                      <>
                        <select 
                          className="modal-input" 
                          style={{ width: '80px', height: '36px', padding: '0 0.5rem' }}
                          value={newBoardQuarter}
                          onChange={e => setNewBoardQuarter(e.target.value)}
                        >
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                        <input
                          type="text"
                          className="modal-input"
                          style={{ width: '80px', height: '36px' }}
                          value={newBoardYear}
                          onChange={e => setNewBoardYear(e.target.value)}
                          placeholder="שנה"
                        />
                      </>
                    )}
                    <button className="btn btn-primary" style={{ padding: '0 1rem', height: '36px' }} onClick={() => { 
                        if(!newBoardName.trim()) return;
                        addRoadmapBoard({ 
                          name: newBoardName, 
                          view_type: newBoardType,
                          quarter: newBoardQuarter,
                          year: newBoardYear,
                          columns: newBoardType === 'kanban' ? [
                            { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
                            { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
                            { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
                          ] : []
                        }); 
                        setNewBoardName(''); 
                      }}>
                      <Plus size={16} /> הוספה
                    </button>
                  </div>
                </div>
              </div>
              <div className="teams-list-grid">
                {(roadmapBoards || []).map(board => (
                  <div key={board.id} className="team-management-item" style={{ minWidth: '150px' }}>
                    <div className="flex-col">
                      <span className="text-sm font-medium">{board.name}</span>
                      <span className="text-xs text-tertiary">
                        {board.view_type === 'timeline' ? `Timeline (${board.quarter} ${board.year})` : `${(board.columns || []).length} עמודות`}
                      </span>
                      <span className="text-[10px] text-accent-primary font-bold">
                        {data.products.find(p => p.id === board.product_id)?.name}
                      </span>
                    </div>
                    <button className="text-danger" onClick={() => deleteRoadmapBoard(board.id)} title="מחיקה" disabled={board.id === 'board_default'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Strategy;
