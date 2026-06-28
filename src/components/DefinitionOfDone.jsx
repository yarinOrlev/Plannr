import React, { useState } from 'react';
import { Plus, X, Check, ListChecks } from 'lucide-react';
import './DefinitionOfDone.css';

const uid = () => `dod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Shared Definition-of-Done checklist editor.
// items: [{ id, text, done }]  ·  onChange(nextItems)
const DefinitionOfDone = ({ items = [], onChange, editable = true }) => {
  const [draft, setDraft] = useState('');
  const list = Array.isArray(items) ? items : [];
  const doneCount = list.filter(i => i.done).length;
  const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...list, { id: uid(), text, done: false }]);
    setDraft('');
  };
  const toggle = (id) => onChange(list.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id) => onChange(list.filter(i => i.id !== id));
  const editText = (id, text) => onChange(list.map(i => i.id === id ? { ...i, text } : i));

  return (
    <div className="dod">
      <div className="dod-head">
        <span className="dod-title"><ListChecks size={15} /> הגדרת סיום (DoD)</span>
        {list.length > 0 && (
          <span className={`dod-progress ${pct === 100 ? 'dod-progress--complete' : ''}`}>
            {doneCount}/{list.length}
          </span>
        )}
      </div>

      {list.length > 0 && (
        <div className="dod-bar"><div className="dod-bar-fill" style={{ width: `${pct}%` }} /></div>
      )}

      <div className="dod-list">
        {list.map(item => (
          <div key={item.id} className={`dod-item ${item.done ? 'dod-item--done' : ''}`}>
            <button type="button" className="dod-check" onClick={() => toggle(item.id)}
              title={item.done ? 'בטל סימון' : 'סמן כבוצע'}>
              {item.done && <Check size={12} />}
            </button>
            {editable ? (
              <input className="dod-text-input" value={item.text}
                onChange={e => editText(item.id, e.target.value)} placeholder="פריט..." />
            ) : (
              <span className="dod-text">{item.text}</span>
            )}
            {editable && (
              <button type="button" className="dod-remove" onClick={() => remove(item.id)} title="הסר">
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && !editable && (
          <span className="dod-empty">לא הוגדרו קריטריוני סיום</span>
        )}
      </div>

      {editable && (
        <div className="dod-add">
          <input className="dod-add-input" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="הוסף קריטריון סיום ולחץ Enter..." />
          <button type="button" className="dod-add-btn" onClick={add}><Plus size={14} /></button>
        </div>
      )}
    </div>
  );
};

export default DefinitionOfDone;
