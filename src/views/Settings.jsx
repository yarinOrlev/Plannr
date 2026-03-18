import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Users, Plus, Trash2, Calendar, Zap, ArrowRight, Clock } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { 
    data, 
    addAvailableTeam, 
    removeAvailableTeam,
    roadmapBoards,
    addRoadmapBoard,
    deleteRoadmapBoard
  } = useProductContext();

  const [newTeamName, setNewTeamName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState('kanban');
  const [newBoardQuarter, setNewBoardQuarter] = useState('Q3');
  const [newBoardYear, setNewBoardYear] = useState('2026');

  return (
    <div className="content-area animate-fade-in settings-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">הגדרות מערכת</h1>
          <p className="text-secondary text-lg">ניהול צוותים, לוחות וקונפיגורציה</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="settings-section glass-panel">
          <div className="section-header mb-6">
            <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
              <div className="icon-badge bg-purple"><Users size={20} /></div>
              <h3 className="text-h3">צוותי עבודה</h3>
            </div>
            <div className="add-input-group">
              <input
                type="text"
                className="modal-input"
                style={{ width: '220px' }}
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="שם צוות חדש..."
              />
              <button className="btn btn-primary" onClick={() => { if(!newTeamName.trim()) return; addAvailableTeam(newTeamName); setNewTeamName(''); }}>
                <Plus size={16} /> הוספה
              </button>
            </div>
          </div>
          
          <div className="items-list">
            {(data.availableTeams || []).length > 0 ? (
              (data.availableTeams || []).map(team => (
                <div key={team} className="settings-item-card">
                  <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                    <div className="item-dot bg-purple"></div>
                    <span className="font-medium">{team}</span>
                  </div>
                  <button className="btn-icon text-danger" onClick={() => removeAvailableTeam(team)} title="הסרה">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-tertiary text-center py-4 text-sm italic">טרם הוגדרו צוותים</p>
            )}
          </div>
        </section>

        <section className="settings-section glass-panel">
          <div className="section-header mb-6" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
            <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
              <div className="icon-badge bg-blue"><Calendar size={20} /></div>
              <h3 className="text-h3">לוחות מפת דרכים</h3>
            </div>
            
            <div className="add-board-form w-full">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="modal-input"
                  style={{ flex: 1 }}
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="שם לוח חדש..."
                />
                <select 
                  className="modal-input" 
                  style={{ width: '160px' }}
                  value={newBoardType}
                  onChange={e => setNewBoardType(e.target.value)}
                >
                  <option value="kanban">התקדמות (Kanban)</option>
                  <option value="timeline">ציר זמן (Timeline)</option>
                </select>
              </div>
              
              {newBoardType === 'timeline' && (
                <div className="flex gap-2 mb-3 animate-fade-in">
                  <select 
                    className="modal-input" 
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
                    value={newBoardYear}
                    onChange={e => setNewBoardYear(e.target.value)}
                    placeholder="שנה"
                  />
                </div>
              )}
              
              <button className="btn btn-primary w-full" onClick={() => { 
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
                <Plus size={16} /> יצירת לוח חדש
              </button>
            </div>
          </div>

          <div className="items-list">
            {(roadmapBoards || []).map(board => (
              <div key={board.id} className="settings-item-card roadmap-board-item">
                <div className="flex-col">
                  <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <span className="font-semibold">{board.name}</span>
                    <span className={`badge-xs ${board.view_type === 'timeline' ? 'bg-indigo' : 'bg-teal'}`}>
                      {board.view_type === 'timeline' ? 'Timeline' : 'Kanban'}
                    </span>
                  </div>
                  <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start' }}>
                    <span className="text-xs text-tertiary">
                      {board.view_type === 'timeline' ? `${board.quarter} ${board.year}` : `${(board.columns || []).length} עמודות`}
                    </span>
                    <span className="text-xs text-accent-primary opacity-60">
                      • {data.products.find(p => p.id === board.product_id)?.name || 'כללי'}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn-icon text-danger" 
                  onClick={() => deleteRoadmapBoard(board.id)} 
                  title="מחיקה" 
                  disabled={board.id === 'board_default'}
                  style={{ opacity: board.id === 'board_default' ? 0.3 : 1 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
