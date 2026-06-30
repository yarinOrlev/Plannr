import React from 'react';
import { RefreshCcw } from 'lucide-react';
import './RefreshIndicator.css';

// Subtle, non-blocking indicator shown while data is refetched in the
// background. Unlike the full LoadingScreen it leaves the current UI visible
// and interactive.
const RefreshIndicator = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="refresh-indicator glass-panel" role="status" aria-live="polite">
      <RefreshCcw size={14} className="refresh-indicator-icon" />
      <span>מעדכן נתונים…</span>
    </div>
  );
};

export default RefreshIndicator;
