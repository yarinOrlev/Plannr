import React from 'react';
import { Hexagon } from 'lucide-react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = 'טוען נתונים...' }) => {
  return (
    <div className="loading-screen-container">
      <div className="loading-content">
        <div className="loading-logo-wrapper">
          <Hexagon className="loading-logo" size={64} />
          <div className="loading-logo-glow"></div>
        </div>
        
        <div className="loading-text-wrapper">
          <h2 className="loading-brand">Plannr</h2>
          <div className="loading-status">
            <span className="loading-dot"></span>
            <span className="loading-message">{message}</span>
          </div>
        </div>

        <div className="loading-progress-bar">
          <div className="loading-progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
