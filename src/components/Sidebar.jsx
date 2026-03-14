import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Map, Target, BookOpen, Settings, Hexagon, Compass, SlidersHorizontal, StickyNote, Users, RefreshCcw, Briefcase, LogOut, Database } from 'lucide-react';
import './Sidebar.css';
import { useProductContext } from '../context/ProductContext';

const Sidebar = () => {
  const { user, logout, isHoD, userProfile } = useAuth();
  const { seedInitialData } = useProductContext();
  
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'לוח בקרה', color: 'blue' },
    { path: '/strategy', icon: <Compass size={18} />, label: 'אסטרטגיה', color: 'indigo' },
    { path: '/prioritization', icon: <SlidersHorizontal size={18} />, label: 'תעדוף', color: 'purple' },
    { path: '/roadmaps', icon: <Map size={18} />, label: 'מפת דרכים', color: 'teal' },
    { path: '/objectives', icon: <Target size={18} />, label: 'יעדים', color: 'red' },
    { path: '/customers', icon: <Users size={18} />, label: 'לקוחות', color: 'pink' },
    { path: '/documentation', icon: <BookOpen size={18} />, label: 'תיעוד', color: 'yellow' },
    { path: '/notes', icon: <StickyNote size={18} />, label: 'הערות', color: 'green' },
    { path: '/department', icon: <Briefcase size={18} />, label: 'מבט מחלקתי', color: 'indigo', roles: ['HoD'] },
  ];

  // Explicitly define visibility logic
  const visibleNavItems = navItems.filter(item => {
    // 1. If no roles defined, it's public for all authenticated users
    if (!item.roles || item.roles.length === 0) return true;
    
    // 2. If it is an HoD-only item, show it ONLY if the user is an HoD
    if (item.roles.includes('HoD')) {
      return isHoD;
    }
    
    // Default fallback
    return true;
  });

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Hexagon className="logo-icon text-gradient" size={28} />
        <h2 className="logo-text text-gradient">Plannr</h2>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <div className={`nav-icon-wrapper i-bg-${item.color}`}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div className="user-profile mb-4">
          <div className="user-avatar">{userProfile?.avatar || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{userProfile?.name || 'משתמש'}</span>
            <span className="user-role">{userProfile?.role === 'HoD' ? 'ראש מחלקה' : 'מנהל מוצר'}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="התנתקות">
            <LogOut size={16} />
          </button>
        </div>

        <button className="nav-link settings-btn text-xs" onClick={seedInitialData}>
          <Database size={16} />
          <span>טעינת נתוני דמו</span>
        </button>
        
        <button className="nav-link settings-btn text-xs" onClick={() => {
          if(window.confirm('האם אתה בטוח שברצונך לרענן את הנתונים?')) {
            window.location.reload();
          }
        }}>
          <RefreshCcw size={16} />
          <span>רענון נתונים</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
