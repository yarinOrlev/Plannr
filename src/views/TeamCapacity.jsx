import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { Gauge, Plus, Trash2, Check, X, Pencil, UserPlus, Users } from 'lucide-react';
import './TeamCapacity.css';

// Availability presets — capacity_factor scales a member's per-sprint days.
const CAPACITY_OPTIONS = [
  { value: 1, label: '100% · משרה מלאה' },
  { value: 0.8, label: '80%' },
  { value: 0.6, label: '60%' },
  { value: 0.5, label: '50% · חצי משרה' },
  { value: 0.2, label: '20%' },
];

const EMPTY_DRAFT = { name: '', role_title: '', capacity_factor: 1, active: true };

const initials = (name = '') =>
  name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';

// Shared add/edit form, kept at module scope so it stays referentially stable.
const MemberFormFields = ({ value, onChange, onSave, onCancel, submitLabel }) => (
  <div className="member-form" style={{ direction: 'rtl' }}>
    <div className="field">
      <label>שם</label>
      <input className="modal-input" value={value.name} autoFocus
        onChange={e => onChange({ ...value, name: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="שם מלא" />
    </div>
    <div className="field">
      <label>תפקיד</label>
      <input className="modal-input" value={value.role_title}
        onChange={e => onChange({ ...value, role_title: e.target.value })}
        placeholder="לדוגמה: מפתח/ת Backend" />
    </div>
    <div className="field">
      <label>זמינות</label>
      <select className="modal-input" value={value.capacity_factor}
        onChange={e => onChange({ ...value, capacity_factor: parseFloat(e.target.value) })}>
        {CAPACITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
      <button className="btn btn-primary" onClick={onSave}><Check size={16} /> {submitLabel}</button>
      <button className="btn-icon" onClick={onCancel} title="ביטול"><X size={18} /></button>
    </div>
  </div>
);

const TeamCapacity = () => {
  const {
    teams, activeTeamId, setActiveTeam,
    teamRoster, addMember, updateMember, deleteMember, createTeam,
  } = useProductContext();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);
  const [newTeamName, setNewTeamName] = useState('');

  const visibleTeams = teams || [];

  // First-run: the lead has no team to plan for yet.
  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header">
          <div>
            <h1 className="text-h1 mb-2">צוות וקיבולת</h1>
            <p className="text-secondary text-lg">ניהול אנשי הצוות והזמינות שלהם</p>
          </div>
        </header>
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <Users size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">עדיין אין צוות</h3>
          <p className="text-secondary mb-4">צור צוות כדי להתחיל לנהל אנשים וקיבולת</p>
          <div className="add-input-group">
            <input className="modal-input" style={{ width: 240 }} value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newTeamName.trim()) createTeam(newTeamName.trim()); }}
              placeholder="שם הצוות..." />
            <button className="btn btn-primary"
              onClick={async () => { if (!newTeamName.trim()) return; await createTeam(newTeamName.trim()); setNewTeamName(''); }}>
              <Plus size={16} /> צור צוות
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = teamRoster.filter(m => m.active).length;
  const totalFte = teamRoster.reduce((s, m) => s + (m.active ? Number(m.capacity_factor) || 0 : 0), 0);

  const handleAdd = async () => {
    if (!draft.name.trim()) return;
    await addMember({ ...draft, team_id: activeTeamId });
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditDraft({
      name: m.name,
      role_title: m.role_title || '',
      capacity_factor: Number(m.capacity_factor) || 1,
      active: m.active,
    });
  };
  const saveEdit = async () => {
    if (!editDraft.name.trim()) return;
    await updateMember(editingId, editDraft);
    setEditingId(null);
  };

  return (
    <div className="content-area animate-fade-in team-capacity-layout">
      <header className="page-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="text-h1 mb-2">צוות וקיבולת</h1>
          <p className="text-secondary text-sm">ניהול אנשי הצוות והזמינות שלהם</p>
        </div>
        {visibleTeams.length > 1 && (
          <div className="flex-center gap-2">
            <span className="text-sm text-secondary">צוות:</span>
            <select className="modal-input" style={{ width: 200, height: 38 }}
              value={activeTeamId} onChange={e => setActiveTeam(e.target.value)}>
              {visibleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
      </header>

      <div className="capacity-summary">
        <div className="capacity-stat glass-panel">
          <span className="capacity-stat-value">{activeCount}</span>
          <span className="capacity-stat-label">אנשי צוות פעילים</span>
        </div>
        <div className="capacity-stat glass-panel">
          <span className="capacity-stat-value">{totalFte.toFixed(1)}</span>
          <span className="capacity-stat-label">משרות מלאות (FTE)</span>
        </div>
      </div>

      <section className="glass-panel team-roster-panel">
        <div className="flex-between mb-4" style={{ direction: 'rtl' }}>
          <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
            <div className="icon-badge bg-purple"><Gauge size={20} /></div>
            <h3 className="text-h3">אנשי הצוות</h3>
          </div>
          {!adding && (
            <button className="btn btn-primary" onClick={() => { setDraft(EMPTY_DRAFT); setAdding(true); }}>
              <UserPlus size={16} /> הוסף איש צוות
            </button>
          )}
        </div>

        {adding && (
          <MemberFormFields value={draft} onChange={setDraft} onSave={handleAdd}
            onCancel={() => { setAdding(false); setDraft(EMPTY_DRAFT); }} submitLabel="הוספה" />
        )}

        <div className="roster-list">
          {teamRoster.length === 0 && !adding && (
            <p className="text-tertiary text-sm" style={{ textAlign: 'center', padding: '1rem 0', fontStyle: 'italic' }}>טרם נוספו אנשי צוות</p>
          )}

          {teamRoster.map(m => (
            editingId === m.id ? (
              <MemberFormFields key={m.id} value={editDraft} onChange={setEditDraft}
                onSave={saveEdit} onCancel={() => setEditingId(null)} submitLabel="שמירה" />
            ) : (
              <div key={m.id} className={`member-row ${m.active ? '' : 'is-inactive'}`}>
                <div className="member-main">
                  <div className="member-avatar">{initials(m.name)}</div>
                  <div>
                    <div className="member-name">{m.name}</div>
                    {m.role_title && <div className="member-role">{m.role_title}</div>}
                  </div>
                </div>
                <div className="member-actions">
                  <span className="capacity-pill">{Math.round((Number(m.capacity_factor) || 0) * 100)}%</span>
                  <button className={`btn-xs ${m.active ? 'btn-active' : 'btn-inactive'}`}
                    onClick={() => updateMember(m.id, { active: !m.active })}
                    title={m.active ? 'סמן כלא פעיל' : 'סמן כפעיל'}>
                    {m.active ? 'פעיל' : 'לא פעיל'}
                  </button>
                  <button className="btn-icon" onClick={() => startEdit(m)} title="עריכה"><Pencil size={16} /></button>
                  <button className="btn-icon text-danger" onClick={() => deleteMember(m.id)} title="מחיקה"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          ))}
        </div>
      </section>
    </div>
  );
};

export default TeamCapacity;
