import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Target, BookOpen, Settings, Hexagon, Compass, SlidersHorizontal, StickyNote, Users, Trash2, Briefcase } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'לוח בקרה', color: 'blue' },
    { path: '/strategy', icon: <Compass size={18} />, label: 'אסטרטגיה', color: 'indigo' },
    { path: '/prioritization', icon: <SlidersHorizontal size={18} />, label: 'תעדוף', color: 'purple' },
    { path: '/roadmaps', icon: <Map size={18} />, label: 'מפת דרכים', color: 'teal' },
    { path: '/objectives', icon: <Target size={18} />, label: 'יעדים', color: 'red' },
    { path: '/customers', icon: <Users size={18} />, label: 'לקוחות', color: 'pink' },
    { path: '/documentation', icon: <BookOpen size={18} />, label: 'תיעוד', color: 'yellow' },
    { path: '/notes', icon: <StickyNote size={18} />, label: 'הערות', color: 'green' },
    { path: '/department', icon: <Briefcase size={18} />, label: 'מבט מחלקתי', color: 'indigo' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Hexagon className="logo-icon text-gradient" size={28} />
        <h2 className="logo-text text-gradient">Plannr</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
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

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="nav-link settings-btn" onClick={() => {
          if(window.confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים לערכי ברירת המחדל?')) {
            localStorage.removeItem('dpm_app_data');
            window.location.reload();
          }
        }}>
          <Trash2 size={20} />
          <span>איפוס נתונים</span>
        </button>
        <button className="nav-link settings-btn">
          <Settings size={20} />
          <span>הגדרות</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
