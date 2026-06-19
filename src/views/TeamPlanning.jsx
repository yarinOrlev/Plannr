import React, { useMemo } from 'react';
import { useProductContext } from '../context/ProductContext';
import { CalendarRange, Users } from 'lucide-react';
import './TeamPlanning.css';

const QUARTER_ORDER = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

const meterColor = (load, capacity) => {
  if (!capacity) return 'gray';
  const ratio = load / capacity;
  if (ratio > 1) return 'red';
  if (ratio > 0.9) return 'amber';
  return 'green';
};

const FeasibilityBar = ({ load, capacity }) => {
  const color = meterColor(load, capacity);
  const pct = capacity ? Math.min(100, (load / capacity) * 100) : 0;
  return (
    <div className="capacity-meter">
      <div className="capacity-meter-head">
        <span className="capacity-meter-label">דרישה מול קיבולת</span>
        <span className={`capacity-meter-value text-${color}`}>{load} / {capacity} ימים</span>
      </div>
      <div className="capacity-meter-track">
        <div className={`capacity-meter-fill fill-${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const TeamPlanning = () => {
  const {
    activeTeamId, teams, setActiveTeam,
    teamSprints, getSprintCapacity, getSprintLoad,
  } = useProductContext();

  // Group sprints into quarters, then years.
  const quarters = useMemo(() => {
    const map = {};
    teamSprints.forEach(s => {
      const year = s.year || '—';
      const quarter = s.quarter || '—';
      const key = `${year}|${quarter}`;
      if (!map[key]) map[key] = { year, quarter, sprints: [], load: 0, capacity: 0 };
      map[key].sprints.push(s);
      map[key].load += getSprintLoad(s.id);
      map[key].capacity += getSprintCapacity(s.id);
    });
    return Object.values(map).sort((a, b) =>
      (Number(a.year) || 0) - (Number(b.year) || 0) ||
      (QUARTER_ORDER[a.quarter] || 9) - (QUARTER_ORDER[b.quarter] || 9));
  }, [teamSprints, getSprintLoad, getSprintCapacity]);

  // Yearly rollup.
  const years = useMemo(() => {
    const map = {};
    quarters.forEach(q => {
      if (!map[q.year]) map[q.year] = { year: q.year, load: 0, capacity: 0 };
      map[q.year].load += q.load;
      map[q.year].capacity += q.capacity;
    });
    return Object.values(map).sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  }, [quarters]);

  if (!activeTeamId) {
    return (
      <div className="content-area animate-fade-in">
        <header className="page-header">
          <div>
            <h1 className="text-h1 mb-2">תכנון רבעוני ושנתי</h1>
            <p className="text-secondary text-lg">קיבולת הצוות מול דרישות לאורך זמן</p>
          </div>
        </header>
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <Users size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין צוות עדיין</h3>
          <p className="text-secondary">צור צוות ותכנן ספרינטים כדי לראות כאן את התמונה הרבעונית.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in team-planning-layout">
      <header className="page-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="text-h1 mb-2">תכנון רבעוני ושנתי</h1>
          <p className="text-secondary text-sm">קיבולת הצוות מול דרישות לאורך זמן</p>
        </div>
        {(teams || []).length > 1 && (
          <div className="flex-center gap-2">
            <span className="text-sm text-secondary">צוות:</span>
            <select className="modal-input" style={{ width: 200, height: 38 }}
              value={activeTeamId} onChange={e => setActiveTeam(e.target.value)}>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
      </header>

      {quarters.length === 0 ? (
        <div className="empty-state" style={{ direction: 'rtl' }}>
          <CalendarRange size={48} className="text-tertiary mb-4" />
          <h3 className="text-h3 mb-2">אין ספרינטים מתוכננים</h3>
          <p className="text-secondary">צור ספרינטים עם תאריכים במסך "תכנון ספרינטים" כדי לבנות תוכנית רבעונית.</p>
        </div>
      ) : (
        <>
          {years.length > 0 && (
            <section className="year-summary">
              {years.map(y => (
                <div key={y.year} className="glass-panel year-summary-card">
                  <span className="year-summary-label">שנת {y.year}</span>
                  <span className={`year-summary-value text-${meterColor(y.load, y.capacity)}`}>
                    {y.load} / {y.capacity} ימים
                  </span>
                </div>
              ))}
            </section>
          )}

          <div className="quarter-grid">
            {quarters.map(q => (
              <div key={`${q.year}-${q.quarter}`} className="glass-panel quarter-card" style={{ direction: 'rtl' }}>
                <div className="quarter-card-head">
                  <h3 className="text-h3">{q.quarter} {q.year}</h3>
                  <span className="badge badge-gray">{q.sprints.length} ספרינטים</span>
                </div>
                <FeasibilityBar load={q.load} capacity={q.capacity} />
                <ul className="quarter-sprint-list">
                  {q.sprints.map(s => (
                    <li key={s.id} className="quarter-sprint-row">
                      <span>{s.name}</span>
                      <span className="text-tertiary text-xs">
                        {getSprintLoad(s.id)}/{getSprintCapacity(s.id)}ד
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamPlanning;
