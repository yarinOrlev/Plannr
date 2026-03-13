import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        
        <main className="main-content">
          <Header />
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/department" element={<DepartmentOverview />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/prioritization" element={<Prioritization />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
