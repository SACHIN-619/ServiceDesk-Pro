import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailModal from './components/TicketDetailModal';
import AuthModal from './components/AuthModal';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ITManagerDashboard from './pages/ITManagerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AssetManagerDashboard from './pages/AssetManagerDashboard';
import TicketList from './components/TicketList';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AssetsPage from './pages/AssetsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { fetchAPI } from './services/api';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentRole } = useAuth();
  const normalizedAllowed = new Set(allowedRoles);
  if (normalizedAllowed.has('ADMIN') || normalizedAllowed.has('SYSTEM_ADMIN')) {
    normalizedAllowed.add('ADMIN');
    normalizedAllowed.add('SYSTEM_ADMIN');
  }

  if (!normalizedAllowed.has(currentRole)) {
    return (
      <div className="glass-panel" style={{ padding: 40, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <h3 style={{ color: '#ef4444', marginBottom: 12 }}>🚫 Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Your active authenticated role (<strong>{currentRole}</strong>) is not authorized to access this section.
        </p>
      </div>
    );
  }

  return children;
};

const MainLayout = () => {
  const { currentRole, user } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const location = useLocation();

  const loadAllTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const data = await fetchAPI('/tickets');
      setTickets(data);
    } catch (e) {
      console.error('Error fetching tickets:', e.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadAllTickets();
  }, [currentRole, user]);

  // Check if URL matches /tickets/:id
  useEffect(() => {
    if (location.pathname.startsWith('/tickets/')) {
      const ticketId = location.pathname.split('/')[2];
      if (ticketId && ticketId !== 'new') {
        setSelectedTicketId(ticketId);
        setIsDetailModalOpen(true);
      }
    }
  }, [location.pathname]);

  const handleOpenDetail = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
  };

  // Render role-tailored home dashboard
  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'ADMIN':
      case 'SYSTEM_ADMIN':
        return <AdminDashboard onSelectTicket={handleOpenDetail} />;
      case 'IT_MANAGER':
        return <ITManagerDashboard onSelectTicket={handleOpenDetail} />;
      case 'TECHNICIAN':
        return <TechnicianDashboard onSelectTicket={handleOpenDetail} />;
      case 'EMPLOYEE':
        return <EmployeeDashboard onSelectTicket={handleOpenDetail} onCreateTicketClick={() => setIsCreateModalOpen(true)} />;
      case 'ASSET_MANAGER':
        return <AssetManagerDashboard />;
      default:
        return <EmployeeDashboard onSelectTicket={handleOpenDetail} onCreateTicketClick={() => setIsCreateModalOpen(true)} />;
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          onCreateTicketClick={() => setIsAuthModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Login />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar & Role Switcher */}
      <Navbar
        onCreateTicketClick={() => setIsCreateModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, padding: 24, gap: 24, maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        <Sidebar />

        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={renderDashboardByRole()} />
            <Route path="/dashboard" element={renderDashboardByRole()} />
            <Route
              path="/tickets"
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      📋 IT Support Tickets ({currentRole})
                    </h2>
                    <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                      + Create Ticket
                    </button>
                  </div>
                  <TicketList
                    tickets={tickets}
                    onSelectTicket={handleOpenDetail}
                    loading={loadingTickets}
                  />
                </div>
              }
            />
            <Route path="/tickets/:id" element={renderDashboardByRole()} />
            <Route
              path="/sla"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER']}>
                  <AdminDashboard onSelectTicket={handleOpenDetail} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN', 'ASSET_MANAGER', 'IT_MANAGER', 'TECHNICIAN']}>
                  <AssetsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN']}>
                  <AdminDashboard onSelectTicket={handleOpenDetail} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSTEM_ADMIN']}>
                  <AdminDashboard onSelectTicket={handleOpenDetail} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={() => {
          loadAllTickets();
        }}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTicketId(null);
        }}
        onTicketUpdated={() => {
          loadAllTickets();
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <MainLayout />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
