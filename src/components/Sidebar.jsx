import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Map, Target, BookOpen, Settings, Hexagon, Compass, SlidersHorizontal, StickyNote, Users, RefreshCcw, Briefcase, LogOut, Database, Gauge, CalendarRange, BarChart3 } from 'lucide-react';
import './Sidebar.css';
import { useProductContext } from '../context/ProductContext';

const ROLE_LABELS = {
  HoD: 'ראש מחלקה',
  TeamLead: 'ראש צוות',
  PM: 'מנהל מוצר',
};

const Sidebar = () => {
  const { logout, userProfile } = useAuth();
  const { seedInitialData } = useProductContext();
  
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'לוח בקרה', color: 'blue' },
    { path: '/strategy', icon: <Compass size={18} />, label: 'אסטרטגיה', color: 'indigo' },
    { path: '/prioritization', icon: <SlidersHorizontal size={18} />, label: 'פיצרים ומשימות', color: 'purple' },
    { path: '/roadmaps', icon: <Map size={18} />, label: 'מפת דרכים', color: 'teal' },
    { path: '/objectives', icon: <Target size={18} />, label: 'יעדים', color: 'red' },
    { path: '/customers', icon: <Users size={18} />, label: 'לקוחות ומשתמשים', color: 'pink' },
    { path: '/documentation', icon: <BookOpen size={18} />, label: 'תיעוד', color: 'yellow' },
    { path: '/notes', icon: <StickyNote size={18} />, label: 'הערות', color: 'green' },
    { path: '/team/capacity', icon: <Gauge size={18} />, label: 'צוות וקיבולת', color: 'teal', roles: ['TeamLead', 'HoD'] },
    { path: '/team/sprints', icon: <CalendarRange size={18} />, label: 'תכנון ספרינטים', color: 'blue', roles: ['TeamLead', 'HoD'] },
    { path: '/team/planning', icon: <BarChart3 size={18} />, label: 'תכנון רבעוני', color: 'indigo', roles: ['TeamLead', 'HoD'] },
    { path: '/department', icon: <Briefcase size={18} />, label: 'מבט מחלקתי', color: 'indigo', roles: ['HoD'] },
    { path: '/settings', icon: <Settings size={18} />, label: 'הגדרות', color: 'gray' },
  ];

  // Items without a `roles` list are public to all authenticated users;
  // otherwise the user's role must be in the list.
  const userRole = userProfile?.role;
  const visibleNavItems = navItems.filter(item =>
    !item.roles || item.roles.length === 0 || item.roles.includes(userRole)
  );

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
            <span className="user-role">{ROLE_LABELS[userProfile?.role] || 'מנהל מוצר'}</span>
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
