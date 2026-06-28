import React, { useRef, useLayoutEffect } from 'react';
import { List, ListOrdered, Eye, Pencil } from 'lucide-react';
import './RichText.css';

const BULLET_RE = /^(\s*)[-*•]\s+(.*)$/;
const NUMBER_RE = /^(\s*)\d+[.)]\s+(.*)$/;

// ── Parse plain text (with simple "- " / "1. " list syntax) into blocks ──
const parseBlocks = (text = '') => {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (BULLET_RE.test(line)) {
      const items = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) { items.push(lines[i].match(BULLET_RE)[2]); i++; }
      blocks.push({ type: 'ul', items });
    } else if (NUMBER_RE.test(line)) {
      const items = [];
      while (i < lines.length && NUMBER_RE.test(lines[i])) { items.push(lines[i].match(NUMBER_RE)[2]); i++; }
      blocks.push({ type: 'ol', items });
    } else if (line.trim() === '') {
      i++;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !BULLET_RE.test(lines[i]) && !NUMBER_RE.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      blocks.push({ type: 'p', lines: para });
    }
  }
  return blocks;
};

// ── Read-only rendered view (auto direction per block) ──
export const RichTextView = ({ text, className = '' }) => {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className={`rt-view ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'ul') return <ul dir="auto" key={idx}>{b.items.map((t, j) => <li dir="auto" key={j}>{t}</li>)}</ul>;
        if (b.type === 'ol') return <ol dir="auto" key={idx}>{b.items.map((t, j) => <li dir="auto" key={j}>{t}</li>)}</ol>;
        return (
          <p dir="auto" key={idx}>
            {b.lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{l}</React.Fragment>)}
          </p>
        );
      })}
    </div>
  );
};

// Single-line, marker-stripped preview for compact rows
export const descPreview = (text = '') => {
  const firstReal = String(text).replace(/\r/g, '').split('\n').find(l => l.trim() !== '') || '';
  return firstReal.replace(BULLET_RE, '$2').replace(NUMBER_RE, '$2').trim();
};

// ── Editable rich text (textarea + list toolbar + preview toggle) ──
const RichTextEditor = ({ value = '', onChange, placeholder = '', rows = 4 }) => {
  const taRef = useRef(null);
  const caretRef = useRef(null);
  const [preview, setPreview] = React.useState(false);

  // Restore caret after a programmatic value change (list toggles / Enter continue)
  useLayoutEffect(() => {
    if (caretRef.current != null && taRef.current) {
      taRef.current.selectionStart = taRef.current.selectionEnd = caretRef.current;
      caretRef.current = null;
    }
  });

  const applyList = (kind) => {
    const ta = taRef.current;
    if (!ta) return;
    const val = value || '';
    const lineStart = val.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let lineEnd = val.indexOf('\n', ta.selectionEnd);
    if (lineEnd === -1) lineEnd = val.length;
    const lines = val.slice(lineStart, lineEnd).split('\n');
    const stripped = lines.map(l => l.replace(/^(\s*)([-*•]\s+|\d+[.)]\s+)/, '$1'));
    let next;
    if (kind === 'ul') {
      const allBullet = lines.every(l => l.trim() === '' || BULLET_RE.test(l));
      next = allBullet ? stripped : stripped.map(l => l.trim() === '' ? l : `- ${l.trimStart()}`);
    } else {
      const allNum = lines.every(l => l.trim() === '' || NUMBER_RE.test(l));
      let n = 0;
      next = allNum ? stripped : stripped.map(l => l.trim() === '' ? l : `${++n}. ${l.trimStart()}`);
    }
    const newVal = val.slice(0, lineStart) + next.join('\n') + val.slice(lineEnd);
    caretRef.current = (val.slice(0, lineStart) + next.join('\n')).length;
    onChange(newVal);
    requestAnimationFrame(() => ta.focus());
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const ta = e.target;
    const val = value || '';
    const start = ta.selectionStart;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const curLine = val.slice(lineStart, start);
    const bm = curLine.match(/^(\s*)([-*•])\s+(.*)$/);
    const nm = curLine.match(/^(\s*)(\d+)([.)])\s+(.*)$/);
    if (!bm && !nm) return;
    e.preventDefault();
    const content = bm ? bm[3] : nm[4];
    if (content.trim() === '') {
      // empty item → exit the list
      const newVal = val.slice(0, lineStart) + val.slice(start);
      caretRef.current = lineStart;
      onChange(newVal);
      return;
    }
    const insert = bm ? `\n${bm[1]}${bm[2]} ` : `\n${nm[1]}${Number(nm[2]) + 1}${nm[3]} `;
    const newVal = val.slice(0, start) + insert + val.slice(ta.selectionEnd);
    caretRef.current = start + insert.length;
    onChange(newVal);
  };

  return (
    <div className="rt-editor">
      <div className="rt-toolbar">
        <button type="button" className="rt-tool-btn" onMouseDown={e => e.preventDefault()}
          onClick={() => applyList('ul')} title="רשימת תבליטים"><List size={15} /></button>
        <button type="button" className="rt-tool-btn" onMouseDown={e => e.preventDefault()}
          onClick={() => applyList('ol')} title="רשימה ממוספרת"><ListOrdered size={15} /></button>
        <span className="rt-toolbar-spacer" />
        <button type="button" className={`rt-tool-btn rt-tool-toggle ${preview ? 'active' : ''}`}
          onClick={() => setPreview(p => !p)} title={preview ? 'עריכה' : 'תצוגה'}>
          {preview ? <Pencil size={14} /> : <Eye size={14} />}
          <span>{preview ? 'עריכה' : 'תצוגה'}</span>
        </button>
      </div>

      {preview ? (
        <div className="rt-preview-box">
          {String(value).trim()
            ? <RichTextView text={value} />
            : <span className="rt-preview-empty">אין תיאור</span>}
        </div>
      ) : (
        <textarea
          ref={taRef}
          className="premium-input rt-textarea"
          dir="auto"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
