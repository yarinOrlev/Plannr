import React from 'react';
import { useProductContext } from '../context/ProductContext';
import { 
  BarChart3, Activity, AlertCircle, CheckCircle2, 
  Target, Users, Zap, Compass, TrendingUp, 
  MessageSquare, Heart, Building, ArrowRight
} from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Dashboard.css';

const StatBox = ({ title, value, icon, color }) => (
  <div className="glass-panel p-4 flex items-center justify-between mini-card">
    <div>
      <p className="text-xs text-tertiary uppercase font-bold tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
      {icon}
    </div>
  </div>
);

const Dashboard = () => {
  const { 
    activeProduct, activeRoadmaps, activeObjectives, activeReviews, 
    activeStrategy, activeCustomers, activeProductUsers,
    data, updateReviewStatus, selectedProductIds 
  } = useProductContext();

  if (!activeProduct) return null;

  // Calculators
  const pendingReviews = activeReviews.filter(r => r.status === 'Pending');
  const avgProgress = activeObjectives.length
    ? Math.round(activeObjectives.reduce((s, o) => s + (o.progress || 0), 0) / activeObjectives.length)
    : 0;

  // Fix: Strategy should reflect the SINGLE selected product if only one is chosen, 
  // or the active product as a fallback.
  const targetId = selectedProductIds.length === 1 ? selectedProductIds[0] : activeProduct.id;
  const product = data.products.find(p => p.id === targetId) || activeProduct;
  const productStrategy = data.strategy.filter(s => s.product_id === targetId);

  const rawVision = productStrategy.find(s => s.type === 'Vision');
  const solution = productStrategy.find(s => s.type === 'Product')?.description || 'הגדר את מהות הפתרון באזור האסטרטגיה';
  const problem = productStrategy.find(s => s.type === 'Problem')?.title || 'הבעיה';
  const people = productStrategy.find(s => s.type === 'People')?.title || 'קהל היעד';

  // Vision fallback logic similar to Strategy.jsx
  const vision = rawVision?.description || `עבור ${people} הנאבקים עם ${problem}, ${product.name} מספק את הפתרון האידיאלי.`;

  const healthCounts = activeCustomers.reduce((acc, c) => {
    const h = c.health || 'neutral';
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, { happy: 0, neutral: 0, risk: 0 });

  const nextItems = activeRoadmaps
    .filter(r => r.bucket === 'Now' || r.bucket === 'Next')
    .sort((a, b) => (a.bucket === 'Now' ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="content-area animate-fade-in dashboard-layout">
      <header className="page-header sticky top-0 bg-inherit z-10 pb-4">
        <div>
          <h1 className="text-h1 mb-1">לוח בקרה לניהול מוצר</h1>
          <p className="text-secondary text-lg">סנכרון אסטרטגיה, יעדים ולקוחות</p>
        </div>
      </header>

      <MultiProductSelector />

      <div className="dashboard-hub mt-6">
        
        {/* 1. Strategic Centerpiece - Only show if EXACTLY one product is selected */}
        {selectedProductIds.length === 1 && (
          <section className="hub-centerpiece glass-panel rounded-3xl animate-scale-in">
            <div className="max-w-2xl mx-auto">
              <div className="flex-center gap-2 mb-4 text-accent-primary">
                <Compass size={24} />
                <span className="uppercase tracking-widest font-bold text-sm">חזון ומהות המוצר</span>
              </div>
              <h2 className="text-h2 mb-4 text-white">"{vision}"</h2>
              <p className="text-lg text-secondary italic opacity-80">{solution}</p>
            </div>
          </section>
        )}

        {/* 2. Key Metrics Pulse */}
        <div className="hub-stats-row">
          <StatBox title="מדד הצלחה (Avg)" value={`${avgProgress}%`} icon={<Zap size={20}/>} color="yellow" />
          <StatBox title="יעדים פעילים" value={activeObjectives.length} icon={<Target size={20}/>} color="purple" />
          <StatBox title="לקוחות מנוהלים" value={activeCustomers.length} icon={<Building size={20}/>} color="blue" />
          <StatBox title="משתמשי קצה" value={activeProductUsers.length} icon={<Users size={20}/>} color="green" />
        </div>

        {/* 3. Left Section: Execution & Planning */}
        <div className="hub-section-left">
          
          {/* OKR Progress */}
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex-between mb-6">
              <h3 className="text-h3 flex items-center gap-2"><TrendingUp size={20} className="text-purple-400"/> התקדמות יעדים (OKRs)</h3>
              <span className="text-xs text-tertiary">רבעון נוכחי</span>
            </div>
            <div className="okr-list">
              {activeObjectives.slice(0, 4).map(obj => (
                <div key={obj.id} className="okr-mini-row mb-4">
                  <div className="flex-between text-sm mb-1">
                    <span className="font-medium">{obj.title}</span>
                    <span className="text-tertiary font-mono">{obj.progress}%</span>
                  </div>
                  <div className="okr-progress-bg">
                    <div 
                      className="okr-progress-fill bg-purple-500" 
                      style={{ width: `${obj.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {activeObjectives.length === 0 && <p className="text-sm text-tertiary text-center py-4">אין יעדים מוגדרים</p>}
            </div>
          </section>

          {/* Roadmap Snapshot */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-h3 mb-6 flex items-center gap-2"><Activity size={20} className="text-blue-400"/> אבני דרך קרובות (Execution)</h3>
            <div className="hub-activity-list">
              {nextItems.map(item => (
                <div key={item.id} className="hub-activity-item border-l-2 border-blue-500/30 hover:border-blue-500 transition-all">
                  <div className="flex-1">
                    <div className="flex-between mb-1">
                      <span className="font-semibold text-sm">{item.title}</span>
                      <span className={`badge ${item.bucket === 'Now' ? 'badge-indigo' : 'badge-gray'} text-[10px]`}>{item.bucket}</span>
                    </div>
                    <p className="text-xs text-tertiary line-clamp-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 4. Right Section: Market & Feedback */}
        <div className="hub-section-right">
          
          {/* Customer Sentiment */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-h3 mb-6 flex items-center gap-2"><Heart size={20} className="text-pink-400"/> סנטימנט לקוחות ומשתמשים</h3>
            <div className="flex justify-around mb-8">
              <div className="text-center">
                <div className="health-dot-pulse bg-success mx-auto mb-2" />
                <div className="text-2xl font-bold">{healthCounts.happy}</div>
                <div className="text-[10px] text-tertiary uppercase">Happy</div>
              </div>
              <div className="text-center">
                 <div className="health-dot-pulse bg-tertiary mx-auto mb-2" />
                 <div className="text-2xl font-bold">{healthCounts.neutral}</div>
                 <div className="text-[10px] text-tertiary uppercase">Neutral</div>
              </div>
              <div className="text-center">
                 <div className="health-dot-pulse bg-danger mx-auto mb-2" />
                 <div className="text-2xl font-bold">{healthCounts.risk}</div>
                 <div className="text-[10px] text-tertiary uppercase">At Risk</div>
              </div>
            </div>
            
            <div className="visual-connector" />
            
            <h4 className="text-xs font-bold text-tertiary uppercase mb-3 flex items-center gap-1">
              <MessageSquare size={12}/> בקשות משתמשים אחרונות
            </h4>
            <div className="space-y-2">
              {activeProductUsers.filter(u => u.needs).slice(0, 3).map(user => (
                <div key={user.id} className="p-2 bg-white/5 rounded text-xs italic text-secondary">
                  "{user.needs}" 
                  <span className="block text-[9px] text-tertiary mt-1">— {user.name}, {user.role}</span>
                </div>
              ))}
              {activeProductUsers.filter(u => u.needs).length === 0 && <p className="text-xs text-tertiary italic text-center">אין בקשות מתועדות</p>}
            </div>
          </section>

          {/* HOD Feedback (if any) */}
          {pendingReviews.length > 0 && (
            <section className="glass-panel p-6 rounded-2xl border-l-[3px] border-yellow-500/50">
              <h3 className="text-h3 mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-yellow-400"/> פידבק מההנהלה</h3>
              <div className="space-y-3">
                {pendingReviews.map(rev => (
                  <div key={rev.id} className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                    <p className="text-xs mb-2 leading-relaxed font-medium">{rev.content}</p>
                    <button 
                      className="btn btn-primary text-[10px] py-1 px-3" 
                      onClick={() => updateReviewStatus(rev.id, 'Resolved')}
                    >
                      סמן כבוצע
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
