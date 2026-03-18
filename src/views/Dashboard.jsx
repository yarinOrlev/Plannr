import React from 'react';
import { useProductContext } from '../context/ProductContext';
import { BarChart3, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Dashboard.css';

const StatCard = ({ title, value, label, icon, trend, type }) => (
  <div className={`stat-card glass-panel type-${type}`}>
    <div className="stat-card-header">
      <div className="stat-title text-tertiary text-sm font-medium">{title}</div>
      <div className={`stat-icon-wrapper bg-${type}`}>{icon}</div>
    </div>
    <div className="stat-card-body">
      <div className="stat-value text-h2">{value}</div>
      {trend && <div className={`stat-trend text-sm ${trend > 0 ? 'text-success' : 'text-danger'}`}>{trend > 0 ? '+' : ''}{trend}% מהרבעון הקודם</div>}
      {label && <div className="stat-label text-sm text-tertiary">{label}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { activeProduct, activeRoadmaps, activeObjectives, activeReviews, data, updateReviewStatus, selectedProductIds } = useProductContext();
  if (!activeProduct) return null;

  const pendingReviews = activeReviews.filter(r => r.status === 'Pending');

  const nowItems = activeRoadmaps.filter(r => r.bucket === 'Now').length;
  const avgProgress = activeObjectives.length
    ? Math.round(activeObjectives.reduce((s, o) => s + o.progress, 0) / activeObjectives.length)
    : 0;

  return (
    <div className="content-area animate-fade-in dashboard-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">ברוכים הבאים 👋</h1>
          <p className="text-secondary text-lg">סקירת ביצועים ופעילות</p>
        </div>
      </header>

      <MultiProductSelector />

      <section className="dashboard-grid">
        <StatCard title="פיצ'רים בעבודה" value={nowItems} label="בשלב Now" icon={<Activity size={20} />} type="blue" />
        <StatCard title="התקדמות ממוצעת ביעדים" value={`${avgProgress}%`} trend={+12} icon={<BarChart3 size={20} />} type="purple" />
        <StatCard title="התראות" value="3" label="דורשים טיפול" icon={<AlertCircle size={20} />} type="yellow" />
        <StatCard title="יעדים שהושלמו" value="1" label="ברבעון הנוכחי" icon={<CheckCircle2 size={20} />} type="green" />
      </section>

      <div className="dashboard-columns">
        <section className="glass-panel p-6">
          <h3 className="text-h3 mb-4">אבני דרך קרובות</h3>
          <div className="milestone-list">
            {activeRoadmaps.map(rm => (
              <div key={rm.id} className="milestone-item">
                <div className="milestone-dot"></div>
                <div className="milestone-content">
                  <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <div className="milestone-title font-medium">{rm.title}</div>
                    {selectedProductIds.length > 1 && (
                      <span className="text-[10px] font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                        {data.products.find(p => p.id === rm.product_id)?.name}
                      </span>
                    )}
                  </div>
                  <div className="milestone-meta text-sm text-tertiary">{rm.bucket} · {rm.description?.slice(0,40) || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-6">
          <h3 className="text-h3 mb-4">פעילות אחרונה</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-avatar bg-purple">JD</div>
              <div className="activity-content">
                <p className="text-sm"><strong className="text-primary">Jane Doe</strong> עדכנה את <strong className="text-primary">מילון אירועים</strong></p>
                <span className="text-xs text-tertiary">לפני שעתיים</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar bg-blue">AS</div>
              <div className="activity-content">
                <p className="text-sm"><strong className="text-primary">Alex Smith</strong> השלים את <strong className="text-primary">Pipeline V2</strong></p>
                <span className="text-xs text-tertiary">אתמול</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {pendingReviews.length > 0 && (
        <section className="glass-panel p-6 mt-6 border-left-accent">
          <div className="flex-between mb-4">
            <h3 className="text-h3 flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
              <Activity size={20} className="text-yellow" /> הערות מנהל מחלקה לטיפול
            </h3>
            <span className="badge badge-yellow">{pendingReviews.length} הערות פתוחות</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviews.map(rev => (
              <div key={rev.id} className="review-card-pm glass-panel p-4 flex-between">
                <div>
                  <div className="flex-center gap-2 mb-1" style={{ justifyContent: 'flex-start' }}>
                    <p className="text-sm font-medium">{data.products.find(p => p.id === rev.product_id)?.name}</p>
                  </div>
                  <p className="text-sm mb-2">{rev.content}</p>
                  <span className="text-xs text-tertiary">{new Date(rev.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <button 
                  className="btn btn-primary text-xs py-1"
                  onClick={() => updateReviewStatus(rev.id, 'Resolved')}
                >
                  <CheckCircle2 size={14} className="ml-1" /> בוצע
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
