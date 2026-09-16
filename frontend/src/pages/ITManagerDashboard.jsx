import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { Shield, Clock, AlertTriangle, Users, ArrowRight, UserCheck } from 'lucide-react';
import TicketList from '../components/TicketList';

const ITManagerDashboard = ({ onSelectTicket }) => {
  const [data, setData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      const [analytics, ticketList] = await Promise.all([
        fetchAPI('/analytics/dashboard'),
        fetchAPI('/tickets')
      ]);
      setData(analytics);
      setTickets(ticketList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading IT Manager Control Center...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Manager Header Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={32} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
              👨‍💼 IT Manager Operations Center
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Monitor team SLA performance, allocate technician workload, and resolve escalations.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="glass-panel stat-card">
          <span className="stat-title">Unassigned Tickets</span>
          <div className="stat-val" style={{ color: '#f97316' }}>{data?.summary?.unassignedTickets || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#f97316' }}>Needs Technician</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">SLA At Risk</span>
          <div className="stat-val" style={{ color: '#fde047' }}>{data?.summary?.slaAtRisk || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#fde047' }}>Due within 2 Hours</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Total SLA Breaches</span>
          <div className="stat-val" style={{ color: '#ef4444' }}>{data?.summary?.slaBreaches || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Action Required</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Active Technicians</span>
          <div className="stat-val" style={{ color: '#06b6d4' }}>{data?.techWorkload?.length || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>Support Engineers</span>
        </div>
      </div>

      {/* Tickets List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
          📋 All Organization Tickets & SLA Compliance
        </h3>
        <TicketList tickets={tickets} onSelectTicket={onSelectTicket} />
      </div>
    </div>
  );
};

export default ITManagerDashboard;
