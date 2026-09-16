import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { Wrench, CheckCircle, Clock, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import TicketList from '../components/TicketList';

const TechnicianDashboard = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignedTickets();
  }, []);

  const loadAssignedTickets = async () => {
    try {
      const data = await fetchAPI('/tickets?myAssigned=true');
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const highPriorityCount = tickets.filter(t => ['Critical', 'High'].includes(t.priority)).length;
  const resolvedToday = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Technician Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wrench size={32} color="#06b6d4" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
              🧑‍💻 Technician Workspace & Work Queue
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              View assigned tickets, record technical work logs, access AI RAG recommendations, and resolve issues.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="glass-panel stat-card">
          <span className="stat-title">My Assigned Queue</span>
          <div className="stat-val" style={{ color: '#06b6d4' }}>{tickets.length}</div>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>Total Assigned</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">High & Critical Priority</span>
          <div className="stat-val" style={{ color: '#f97316' }}>{highPriorityCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#f97316' }}>Urgent Attention</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Resolved Today</span>
          <div className="stat-val" style={{ color: '#10b981' }}>{resolvedToday}</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Completed</span>
        </div>
      </div>

      {/* Queue Table */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
          📌 My Assigned Support Queue
        </h3>
        <TicketList tickets={tickets} onSelectTicket={onSelectTicket} loading={loading} />
      </div>
    </div>
  );
};

export default TechnicianDashboard;
