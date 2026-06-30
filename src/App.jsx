import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useProductContext } from './context/ProductContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import Strategy from './views/Strategy';
import Prioritization from './views/Prioritization';
import Roadmaps from './views/Roadmaps';
import Objectives from './views/Objectives';
import Documentation from './views/Documentation';
import Notes from './views/Notes';
import Customers from './views/Customers';
import DepartmentOverview from './views/DepartmentOverview';
import TeamCapacity from './views/TeamCapacity';
import SprintBoard from './views/SprintBoard';
import TeamPlanning from './views/TeamPlanning';
import SettingsView from './views/Settings';
import FloatingNoteBubble from './components/FloatingNoteBubble';
import Login from './views/Login';
import LoadingScreen from './components/LoadingScreen';
import RefreshIndicator from './components/RefreshIndicator';

const ProtectedRoute = ({ children, requireHoD = false, allowedRoles = null }) => {
  const { isAuthenticated, isHoD, userProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireHoD && !isHoD) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) return <Navigate to="/" replace />;

  return children;
};

function AppContent() {
  const { isAuthenticated, isHoD, loading: authLoading } = useAuth();
  const { activeProduct, loading: productLoading, refreshing, refreshData, fetchError, hasData } = useProductContext();
  const location = useLocation();

  // Intercept the keyboard refresh (Cmd/Ctrl+R and F5) and turn it into a
  // silent in-app data refetch — no page reload, no loading screen. The browser
  // reload *button* and hard reload (Cmd/Ctrl+Shift+R) can't be intercepted by
  // JS, so those still reload; the per-user data cache makes that reload seamless.
  useEffect(() => {
    if (!isAuthenticated) return;
    const onKeyDown = (e) => {
      const isReloadCombo =
        ((e.metaKey || e.ctrlKey) && (e.key === 'r' || e.key === 'R') && !e.shiftKey) ||
        e.key === 'F5';
      if (isReloadCombo) {
        e.preventDefault();
        refreshData();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthenticated, refreshData]);

  if (fetchError) {
    return (
      <div className="loading-screen flex-center flex-col h-screen bg-slate-900 text-white p-4">
        <div className="text-danger mb-4 text-h2 font-bold">שגיאה בטעינת הנתונים</div>
        <div className="bg-danger/10 border border-danger/20 p-4 rounded text-center max-w-md">
          <p className="mb-4">{fetchError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>נסה שוב</button>
        </div>
      </div>
    );
  }

  // Auth has settled with no session → show login.
  if (!authLoading && !isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Nothing to show yet → full-screen loader while the session restores or the
  // first data load runs. On a reload we already have cached data (hasData), so
  // this is skipped (no flicker); a fresh login has no cache, so the loader
  // shows here instead of an empty page.
  if (!hasData && (authLoading || productLoading)) {
    return <LoadingScreen />;
  }

  // Auto-redirect HoD to department overview only if they land on the root AND have no active product selected
  if (isHoD && location.pathname === '/' && !activeProduct) {
    return <Navigate to="/department" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <FloatingNoteBubble />
      <RefreshIndicator visible={refreshing} />
      
      <main className="main-content">
        <Header />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/department" 
            element={
              <ProtectedRoute requireHoD>
                <DepartmentOverview />
              </ProtectedRoute>
            } 
          />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/prioritization" element={<Prioritization />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/objectives" element={<Objectives />} />
          <Route
            path="/team/capacity"
            element={
              <ProtectedRoute allowedRoles={['PM', 'TeamLead', 'HoD']}>
                <TeamCapacity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/sprints"
            element={
              <ProtectedRoute allowedRoles={['PM', 'TeamLead', 'HoD', 'Developer']}>
                <SprintBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/planning"
            element={
              <ProtectedRoute allowedRoles={['PM', 'TeamLead', 'HoD']}>
                <TeamPlanning />
              </ProtectedRoute>
            }
          />
          <Route path="/customers" element={<Customers />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
