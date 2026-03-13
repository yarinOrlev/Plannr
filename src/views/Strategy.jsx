import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Compass, Users, Lightbulb, AlertTriangle, Pencil, X, Check, Trash2, Plus, Calendar } from 'lucide-react';
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

const TYPE_LABELS = { Problem: 'בעיה', People: 'קהל יעד', Product: 'הפתרון' };

const Strategy = () => {
  const { 
    activeProduct, 
    activeStrategy, 
    updateStrategy, 
    data, 
    addAvailableTeam, 
    removeAvailableTeam,
    roadmapBoards,
    addRoadmapBoard,
    deleteRoadmapBoard
  } = useProductContext();
  const [editItem, setEditItem] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState('kanban');
  const [newBoardQuarter, setNewBoardQuarter] = useState('Q3');
  const [newBoardYear, setNewBoardYear] = useState('2026');

  if (!activeProduct) return null;

  const getStrategyItem = (type) => {
    const found = activeStrategy.find(s => s.type === type);
    return found
      ? { ...found, typeLabel: TYPE_LABELS[type] }
      : { type, typeLabel: TYPE_LABELS[type], title: 'לא הוגדר', description: 'לחץ על עריכה כדי להוסיף.' };
  };

  const problem = getStrategyItem('Problem');
  const people  = getStrategyItem('People');
  const product = getStrategyItem('Product');

  const handleSave = () => {
    if (!editItem?.title?.trim()) return;
    updateStrategy(editItem.type, editItem.title, editItem.description);
    setEditItem(null);
  };

  return (
    <div className="content-area animate-fade-in strategy-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">אסטרטגיית מוצר</h1>
          <p className="text-secondary text-lg">מסגרת 3P עבור <strong className="text-primary">{activeProduct.name}</strong></p>
        </div>
      </header>

      {editItem && (
        <div className="strategy-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="strategy-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="text-h3">עריכת — {TYPE_LABELS[editItem.type]}</h3>
              <button className="btn-icon" onClick={() => setEditItem(null)}><X size={18} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label className="text-sm text-secondary block mb-1">כותרת</label>
                <input autoFocus type="text" className="modal-input" value={editItem.title}
                  onChange={e => setEditItem({...editItem, title: e.target.value})} placeholder="כותרת קצרה..." />
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">תיאור</label>
                <textarea className="modal-input" rows={4} value={editItem.description}
                  onChange={e => setEditItem({...editItem, description: e.target.value})} placeholder="פרטים נוספים..." />
              </div>
            </div>
            <div className="flex-between mt-6">
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>ביטול</button>
              <button className="btn btn-primary" onClick={handleSave}><Check size={16} /> שמירה</button>
            </div>
          </div>
        </div>
      )}

      <div className="strategy-grid">
        <StrategyCard item={problem} icon={<AlertTriangle size={24}/>} colorClass="bg-red"   onEdit={setEditItem}/>
        <StrategyCard item={people}  icon={<Users size={24}/>}         colorClass="bg-blue"  onEdit={setEditItem}/>
        <StrategyCard item={product} icon={<Lightbulb size={24}/>}     colorClass="bg-green" onEdit={setEditItem}/>
      </div>
      <div className="vision-section glass-panel">
        <div className="vision-header">
          <Compass size={26} />
          <h2 className="text-h2">חזון המוצר</h2>
        </div>
        <p className="vision-text text-lg text-secondary leading-relaxed">
          עבור <strong className="text-primary">{people.title}</strong> הנאבקים עם{' '}
          <strong className="text-primary">{problem.title}</strong>,{' '}
          <strong className="text-primary">{activeProduct.name}</strong> מספק{' '}
          <em>{product.description}</em>.
        </p>
      </div>

      <div className="teams-management-section glass-panel mt-6">
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
                    viewType: newBoardType,
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
                  {board.viewType === 'timeline' ? `Timeline (${board.quarter} ${board.year})` : `${(board.columns || []).length} עמודות`}
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
  );
};

export default Strategy;
