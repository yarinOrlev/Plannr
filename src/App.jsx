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
import SettingsView from './views/Settings';
import FloatingNoteBubble from './components/FloatingNoteBubble';
import Login from './views/Login';

const ProtectedRoute = ({ children, requireHoD = false }) => {
  const { isAuthenticated, isHoD, loading } = useAuth();

  if (loading) return <div className="loading-screen">טוען...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireHoD && !isHoD) return <Navigate to="/" replace />;

  return children;
};

function AppContent() {
  const { isAuthenticated, isHoD, loading: authLoading } = useAuth();
  const { activeProduct, loading: productLoading, fetchError } = useProductContext();
  const location = useLocation();

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

  if (authLoading || productLoading) {
    return (
      <div className="loading-screen flex-center h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
        <span className="mr-3">טוען...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Auto-redirect HoD to department overview only if they land on the root AND have no active product selected
  if (isHoD && location.pathname === '/' && !activeProduct) {
    return <Navigate to="/department" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <FloatingNoteBubble />
      
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
