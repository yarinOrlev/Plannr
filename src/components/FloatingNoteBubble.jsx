import React, { useState } from 'react';
import { PencilLine, X, Send, StickyNote } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import './FloatingNoteBubble.css';

const FloatingNoteBubble = () => {
  const { addNote, activeProduct } = useProductContext();
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [title, setTitle] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    addNote({
      title: title.trim() || 'הערה מהירה',
      content: noteContent,
      tag: 'כללי'
    });

    setNoteContent('');
    setTitle('');
    setIsOpen(false);
  };

  if (!activeProduct) return null;

  return (
    <div className={`floating-note-wrapper ${isOpen ? 'is-open' : ''}`}>
      {isOpen && (
        <div className="note-popup glass-panel animate-slide-up">
          <div className="note-popup-header flex-between">
            <h4 className="text-sm font-bold flex-center gap-2">
              <PencilLine size={14} className="text-indigo" /> הערה מהירה
            </h4>
            <button className="btn-icon-xs" onClick={() => setIsOpen(false)}>
              <X size={14} />
            </button>
          </div>
          <form className="note-popup-body" onSubmit={handleSave}>
            <input 
              type="text" 
              className="note-input-title" 
              placeholder="כותרת (אופציונלי)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea 
              autoFocus
              className="note-input-content" 
              placeholder="כתוב כאן..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
            ></textarea>
            <div className="flex-between mt-2">
              <span className="text-[10px] text-tertiary">נשמר ל-"הערות"</span>
              <button type="submit" className="btn-send-note">
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
      
      <button 
        className={`floating-bubble-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="הוספת הערה מהירה"
      >
        <PencilLine size={20} />
      </button>
    </div>
  );
};

export default FloatingNoteBubble;
